from flask import Flask, render_template, request
import psycopg2

app = Flask(__name__)

conn = psycopg2.connect(database="postgres", user="postgres", password="123post", host="127.0.0.1", port="5432")
cur = conn.cursor()

@app.route('/')
def hello():
    return render_template('index.html')

@app.route('/reco', methods=['GET', 'POST'])
def reco():
    conn = psycopg2.connect(database="postgres", user="postgres", password="123post", host="127.0.0.1", port="5432")
    cur = conn.cursor()
    cur.execute('''select a.language_code from (select language_code, count(*) from books ) a order by a.count desc''')
    a = []
    row = cur.fetchone()
    while row is not None:
        a.append(row[0])
        row = cur.fetchone()
    return render_template('reco.html', lang = a)

@app.route('/display', methods=['GET', 'POST'])
def display():
    if request.method == 'POST':
        tags_name = request.form['tags']
        rating = request.form['rate']
        lang = request.form['language']
        publication = request.form['year']
        #print(tag_name, author_name, rating, lang)
        conn = psycopg2.connect(database="postgres", user="postgres", password="123post", host="127.0.0.1", port="5432")
        cur = conn.cursor()
        cur.execute('''select a.language_code from (select language_code, count(*) from books ) a order by a.count desc''')
        a = []
        row = cur.fetchone()
        while row is not None:
            a.append(row[0])
            row = cur.fetchone()

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

        cur.execute('''create view result as select distinct fr.title, fr.average_rating, fy.num, b.ratings_count
        from filter_ratings fr, filter_tags ft, filter_year fy, books b
        where fr.id = ft.id and ft.id = fy.id and fy.id = b.id and b.language_code = '{0}' '''.format(lang))

        cur.execute('''select title from result''')
        item = []
        row = cur.fetchone()
        while row is not None:
            item.append(row[0])
            row = cur.fetchone()
        cur.execute('''drop view filter_tags''')
        cur.execute('''drop view filter_ratings''')
        cur.execute('''drop view filter_year''')
        if item == []:
            return render_template('display.html', message = "[No results]")
        else:
            return render_template('display.html', message = item)

@app.route('/display', methods=['GET', 'POST'])
def book_info():
    if request.method == 'POST':
        sorting_parameter = request.args.get("sorting_parameter")
        conn = psycopg2.connect(database="postgres", user="postgres", password="123post", host="127.0.0.1", port="5432")
        cur = conn.cursor()
        if sorting_parameter == 'ratings':
            cur.execute('''Select title from result order by average_rating desc''')

        if sorting_parameter == 'rating_count':
            cur.execute('''Select title from result order by ratings_count desc''')

        if sorting_parameter == 'latest_year':
            cur.execute('''Select title from result order by num desc''')
	    
        item = []
        row = cur.fetchone()
        while row is not None:
            item.append(row[0])
            row = cur.fetchone()

        return render_template('display.html', message = item)


@app.route('/login', methods=['GET', 'POST'])
def login():
    return render_template('login.html')

@app.route('/user_page', methods=['GET', 'POST'])
def user_page():
    user = request.form['username']
    #passw = request.form['password']
    conn = psycopg2.connect(database="postgres", user="postgres", password="123post", host="127.0.0.1", port="5432")
    cur = conn.cursor()

    cur.execute('''select from (select distinct a.user_id 
from (select distinct user_id 
from ratings
union all (select distinct user_id from to_read)) a) b where b.user_id = '{0}' '''.format(user))
    item = cur.fetchall()
    if item:

        return render_template('user_page.html')
    else:
        return render_template('login.html', message = "USER DOES NOT EXISTS")


conn.commit()
conn.close()

if __name__ == "__main__":
    app.run()
