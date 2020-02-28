from flask import Flask, render_template, request
import psycopg2

app = Flask(__name__)

conn = psycopg2.connect(database="postgres", user="postgres",
                        password="123post", host="127.0.0.1", port="5432")
cur = conn.cursor()


@app.route('/')
def hello():
    return render_template('index.html')


@app.route('/reco', methods=['GET', 'POST'])
def reco():
    conn = psycopg2.connect(database="postgres", user="postgres",
                            password="123post", host="127.0.0.1", port="5432")
    cur = conn.cursor()
    cur.execute('''select a.language_code from (select language_code, count(*) from books group by language_code ) a order by a.count desc''')
    a = []
    row = cur.fetchone()
    while row is not None:
        a.append(row[0])
        row = cur.fetchone()
    return render_template('reco.html', lang=a)


@app.route('/display', methods=['GET', 'POST'])
def display():
    if request.method == 'POST':
        tags_name = request.form['tags']
        rating = request.form['rate']
        lang = request.form['language']
        publication = request.form['year']
        #print(tag_name, author_name, rating, lang)
        conn = psycopg2.connect(database="postgres", user="postgres",
                                password="123post", host="127.0.0.1", port="5432")
        cur = conn.cursor()
        #print('husd')
        cur.execute('''drop materialized view if exists result''')
        cur.execute('''drop view if exists filter_tags''')
        cur.execute('''drop view if exists filter_year''')
        cur.execute('''drop view if exists filter_ratings''')
        cur.execute(
            '''select a.language_code from (select language_code, count(*) from books group by language_code) a order by a.count desc''')
        a = []
        row = cur.fetchone()       
        while row is not None:
            a.append(row[0])
            row = cur.fetchone()
        
        #cur.commit()
        cur.execute('''create view filter_ratings as
            select distinct id, title, average_rating
                from books where average_rating > {0} '''.format(rating))
        
        cur.execute('''create view filter_tags as
                select distinct b.id, b.title 
                from books b, tags t, book_tags bt
                where to_tsvector(t.tag_name) @@ phraseto_tsquery('{0}') 
                and t.tag_id = bt.tag_id and bt.goodreads_book_id = b.id '''.format(tags_name))

        cur.execute('''create view filter_year as
                select a.id, a.title, a.num
                from (SELECT id, title, TO_NUMBER(original_publication_year,'9999') as num
                from books
                where original_publication_year != '') a
                where a.num between {0} and {1} '''.format(publication[1:5], publication[6:10]))

        if lang == 'Any':
            cur.execute('''create materialized view result as select distinct b.id, fr.title, fr.average_rating, fy.num, b.ratings_count, b.authors
                from filter_ratings fr, filter_tags ft, filter_year fy, books b
                where fr.id = ft.id and ft.id = fy.id and fy.id = b.id ''')
            conn.commit()
        else:
            cur.execute('''create materialized view result as select distinct b.id, fr.title, fr.average_rating, fy.num, b.ratings_count, b.authors
                from filter_ratings fr, filter_tags ft, filter_year fy, books b
                where fr.id = ft.id and ft.id = fy.id and fy.id = b.id and b.language_code = '{0}' '''.format(lang))
            conn.commit()
            
        cur.execute('''select title, average_rating, authors, id from result''')
        
        item = []
        row = cur.fetchone()
        while row is not None:
            item.append(row)
            row = cur.fetchone()
            # print(item)
        if item == []:
            return render_template('display.html', message="[No results]")
        else:
            return render_template('display.html', message=item)


@app.route('/display/<value>', methods = ['GET', 'POST'])
def sort(value):
    conn = psycopg2.connect(database="postgres", user="postgres",
                                password="123post", host="127.0.0.1", port="5432")
    cur = conn.cursor()
    if value == 'Rating':
        cur.execute(
            '''Select title, average_rating, authors , id from result order by average_rating desc''')

    elif value == 'Popularity':
        cur.execute(
                '''Select title, average_rating, authors, id from result order by ratings_count desc''')
            
    elif value == 'Publication':
        cur.execute(
                    '''Select title, average_rating, authors, id from result order by num desc''')
    item = []
    row = cur.fetchone()
    while row is not None:
        item.append(row)
        row = cur.fetchone()
    return render_template('display.html', message = item)


@app.route('/login', methods=['GET', 'POST'])
def login():
    return render_template('login.html')


@app.route('/user_page', methods=['GET', 'POST'])
def user_page():
    user = request.form['username']
    #passw = request.form['password']
    conn = psycopg2.connect(database="postgres", user="postgres",
                            password="123post", host="127.0.0.1", port="5432")
    cur = conn.cursor()

    cur.execute('''select from (select distinct a.user_id 
from (select distinct user_id 
from ratings
union all (select distinct user_id from to_read)) a) b where b.user_id = '{0}' '''.format(user))
    item = cur.fetchall()
    if item:
        # leaderboard
        cur.execute('''select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) as sno, user_id, count as score
        from (select user_id, count(*)
        from ratings 
        group by user_id
        order by count desc) a limit 10''')
        leader_result = []
        row = cur.fetchone()
        while row is not None:
            leader_result.append(row)
            row = cur.fetchone()

        cur.execute('''select distinct a.id, b.title 
from books b, (select book_id as id
from to_read
where user_id = '{0}') a
where a.id = b.id limit 10''')
        wishlist = []
        row = cur.fetchone()
        while row is not None:
            wishlist.append(row)
            row = cur.fetchone()
        
        cur.execute('''select distinct b.id, b.title
from (select book_id
from ratings 
where user_id = '{0}') a, books b
where a.book_id = b.id limit 10'''.format(user))
        read_books = []
        row = cur.fetchone()
        while row is not None:
            read_books.append(row)
            row = cur.fetchone()

        return render_template('user_page.html', leader = leader_result, desire = wishlist, read = read_books)

    else:
        return render_template('login.html', message="USER DOES NOT EXISTS")


@app.route('/info/<value>', methods=['GET', 'POST'])
def info(value):
    conn = psycopg2.connect(database="postgres", user="postgres",
                            password="123post", host="127.0.0.1", port="5432")
    cur = conn.cursor()
    cur.execute(
        '''select b.title, b.authors, a.rate_count,
TO_NUMBER(b.original_publication_year,'9999') as num,
c.read_count, b.image_url, b.average_rating
from books b, (select count(*) as rate_count from ratings where book_id='{0}') a,
			   (select count(*) as read_count from to_read where book_id = '{0}') c
where b.id = '{0}' '''.format(value))
    item = cur.fetchall()
    #print(item)
    return render_template('info.html', ans = item[0])

@app.route('/register', methods=['GET', 'POST'])
def register():
    return render_template('register.html')

@app.route('/add', methods=['GET', 'POST'])
def add():
    return render_template('add.html')

@app.route('/success', methods=['GET', 'POST'])
def success():
    return render_template('success.html')


conn.commit()
conn.close()

if __name__ == "__main__":
    app.run()
