from flask import Flask, render_template, request
import psycopg2

app = Flask(__name__)

conn = psycopg2.connect(database="postgres", user="postgres",
                        password="123post", host="127.0.0.1", port="5432")
cur = conn.cursor()
cur.execute('''create materialized view if not exists leaderboard as select ROW_NUMBER() OVER(ORDER BY (SELECT 1)) as sno, user_id, count as score
        from (select user_id, count(*)
        from ratings 
        group by user_id
        order by count desc) a''')
cur.execute('''create materialized view if not exists average_rate as
select id, (ratings_1*1 + ratings_2*2+ratings_3*3+ratings_4*4+ratings_5*5)*1.0/(ratings_1+ ratings_2+ratings_3+ratings_4+ratings_5)
from books''')
cur.execute('''create index if not exists book on books (title); create index if not exists tag on tags (tag_name)''')
cur.execute('''ALTER TABLE books ALTER COLUMN ratings_count SET DEFAULT 1;
 ALTER TABLE books ALTER COLUMN ratings_1 SET DEFAULT 0;
 ALTER TABLE books ALTER COLUMN ratings_2 SET DEFAULT 0;
 ALTER TABLE books ALTER COLUMN ratings_3 SET DEFAULT 0;
 ALTER TABLE books ALTER COLUMN ratings_4 SET DEFAULT 0;
 ALTER TABLE books ALTER COLUMN ratings_5 SET DEFAULT 0;
 ALTER TABLE books ALTER COLUMN average_rating SET DEFAULT 0; ''')
cur.execute('''alter table books drop constraint if exists books_pkey;
alter table books add primary key(id); alter table users drop constraint if exists users_pkey;
alter table users add primary key(userid); alter table tags drop constraint if exists tags_pkey;
alter table tags add primary key(tag_id)''')
cur.execute('''select max(id) from books''')
val = cur.fetchone()
#print(val[0])
cur.execute('''CREATE SEQUENCE if not exists books_id_seq start with {0};
ALTER TABLE books ALTER COLUMN id SET DEFAULT nextval('books_id_seq')'''.format(val[0]))

cur.execute('''select max(tag_id) from tags''')
val = cur.fetchone()
#print(val[0])
cur.execute('''CREATE SEQUENCE if not exists tags_tag_id_seq start with {0};
ALTER TABLE tags ALTER COLUMN tag_id SET DEFAULT nextval('tags_tag_id_seq')'''.format(val[0]))

cur.execute('''drop trigger if exists title_trigger on books;
CREATE OR REPLACE FUNCTION people_insert() RETURNS trigger AS 
$BODY$
BEGIN
   new.original_title:= new.title;
   new.best_book_id:=new.id;
   new.book_id:=new.id;
   RETURN NEW;
END;
$BODY$
language plpgsql; 
CREATE TRIGGER title_trigger
before insert on books
FOR EACH ROW EXECUTE PROCEDURE people_insert();
drop trigger if exists rating_trigger on ratings;
CREATE OR REPLACE FUNCTION rate_insert() RETURNS trigger AS 
$BODY$
BEGIN
  	delete from to_read where book_id = new.book_id and user_id = new.user_id;
   RETURN NEW;
END;
$BODY$
language plpgsql; 
CREATE TRIGGER rating_trigger
after insert on ratings
FOR EACH ROW EXECUTE PROCEDURE rate_insert();  ''')

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


@app.route('/reco/display', methods=['GET', 'POST'])
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
        cur.execute('''select a.language_code from (select language_code, count(*) from books group by language_code) a order by a.count desc''')
        a = []
        row = cur.fetchone()       
        while row is not None:
            a.append(row[0])
            row = cur.fetchone()
        
        #cur.commit()
        cur.execute('''create view filter_ratings as
            select distinct b.id, b.title, a.avg
                from books b, average_rate a where a.avg > {0} and a.id = b.id'''.format(rating))
        
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
            cur.execute('''create materialized view result as select distinct b.id, b.small_image_url, fr.title, fr.avg, fy.num, b.ratings_count, b.authors
                from filter_ratings fr, filter_tags ft, filter_year fy, books b
                where fr.id = ft.id and ft.id = fy.id and fy.id = b.id order by fr.title''')
            conn.commit()
        else:
            cur.execute('''create materialized view result as select distinct b.id, b.small_image_url, fr.title, fr.avg, fy.num, b.ratings_count, b.authors
                from filter_ratings fr, filter_tags ft, filter_year fy, books b
                where fr.id = ft.id and ft.id = fy.id and fy.id = b.id and b.language_code = '{0}' order by fr.title'''.format(lang))
            conn.commit()
        cur.execute('''create index if not exists res on result(avg, num, ratings_count)''')
        cur.execute('''select title, ROUND(avg::numeric,2) , authors, id, small_image_url from result''')
        
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
            '''Select title, ROUND(avg::numeric,2), authors , id, small_image_url from result order by avg desc''')

    elif value == 'Popularity':
        cur.execute(
                '''Select title, ROUND(avg::numeric,2), authors, id, small_image_url from result order by ratings_count desc''')
            
    elif value == 'Publication':
        cur.execute(
                    '''Select title, ROUND(avg::numeric,2), authors, id, small_image_url from result order by num desc''')
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

    cur.execute('''SELECT * FROM users WHERE userid = {0} '''.format(user))
    item = cur.fetchall()
    if item:
        # leaderboard
        cur.execute('''select * from leaderboard limit 10''')
        leader_result = []
        row = cur.fetchone()
        while row is not None:
            leader_result.append(row)
            row = cur.fetchone()

        cur.execute('''select distinct a.id, b.title 
from books b, (select book_id as id
from to_read
where user_id = {0}) a
where a.id = b.id'''.format(user))
        wishlist = []
        row = cur.fetchone()
        while row is not None: 
            wishlist.append(row)
            row = cur.fetchone()
        if wishlist == []:
            wishlist.append("None")
        
        cur.execute('''select distinct b.id, b.title
from (select book_id
from ratings 
where user_id = {0}) a, books b
where a.book_id = b.id'''.format(user))
        read_books = []
        row = cur.fetchone()
        while row is not None:
            read_books.append(row)
            row = cur.fetchone()
        if read_books ==[]:
            read_books.append("None")
        #user score
        cur.execute('''select * from leaderboard where user_id = {0} '''.format(user))
        score = cur.fetchone()
        if score is not None:
            return render_template('user_page.html', leader = leader_result, desire = wishlist, user=user, read = read_books, rank = score[0], score = score[2])
        else: 
            return render_template('user_page.html', leader = leader_result, desire = wishlist, user=user, read = read_books, rank = "none" , score = 0)

    else:
        return render_template('login.html', message="USER DOES NOT EXISTS")


@app.route('/info/<value>', methods=['GET', 'POST'])
def info(value):
    conn = psycopg2.connect(database="postgres", user="postgres",
                            password="123post", host="127.0.0.1", port="5432")
    cur = conn.cursor()
    cur.execute('''select distinct b.title, b.authors, a.rate_count,
TO_NUMBER(b.original_publication_year,'9999') as num,
c.read_count, b.image_url, ROUND(ar.avg::numeric,2)
from books b, average_rate ar, (select count(*) as rate_count from ratings where book_id={0}) a,
			   (select count(*) as read_count from to_read where book_id = {0}) c
where b.id = {0} and b.id = ar.id'''.format(value))
    item = cur.fetchall()
    cur.execute('''select tag_id from book_tags 
where goodreads_book_id = {0} '''.format(value))
    cur.execute('''select a.tag_name from tags a, (select tag_id, count from book_tags 
        where goodreads_book_id = {0}) b
        where b.tag_id = a.tag_id
        order by b.count desc limit 10'''.format(value))
    desc = []
    row = cur.fetchone()
    while row is not None:
        desc.append(row[0])
        row = cur.fetchone()
    if desc == []:
        return render_template('info.html', ans = item[0], description = "No description to display")
    else:
        return render_template('info.html', ans = item[0], description = desc)

@app.route('/register', methods=['GET', 'POST'])
def register():
    return render_template('register.html')

@app.route('/get_info', methods=['GET', 'POST'])
def get_info():
    if request.method == "POST":
        tit = request.form['title']
        if tit == '':
            return render_template('get_info.html', message = "Please enter")
        else:
            conn = psycopg2.connect(database="postgres", user="postgres",
                                    password="123post", host="127.0.0.1", port="5432")
            cur = conn.cursor()
            cur.execute('''select id, title, authors, small_image_url from books where to_tsvector(title) @@ phraseto_tsquery('{0}') 
            order by title'''.format(tit))
            item = []
            row = cur.fetchone()
            while row is not None:
                item.append(row)
                row = cur.fetchone()
            return render_template('get_info.html', message = item)
    else:
        return render_template('get_info.html')

@app.route('/add', methods=['GET', 'POST'])
def add():
    return render_template('add.html')

@app.route('/add/success', methods=['GET', 'POST'])
def success_add():
    user = request.form['new_userid']
    tit = request.form['new_title']
    rate = request.form['new_rate']
    tags = request.form['new_tags']
    isbn = request.form['new_isbn']
    lang = request.form['new_lang']
    year = request.form['new_year']
    iurl = request.form['new_iurl']
    siurl = request.form['new_siurl']
    auth = request.form['new_author']
    tags = tags.split(' ')
    year = year+'.0'
    conn = psycopg2.connect(database="postgres", user="postgres",
                            password="123post", host="127.0.0.1", port="5432")
    cur = conn.cursor()
    cur.execute('''select userid from users where userid = {0}'''.format(user))
    row = cur.fetchone()
    if row[0]:
        cur.execute('''SELECT * FROM books WHERE title='{0}' '''.format(tit))
        if cur.fetchall():
            return render_template('add.html', message = "book already exists")
        else:
            cur.execute('''insert into books(title, authors, average_rating, ratings_{6}, isbn, image_url, small_image_url, language_code,
            original_publication_year) 
            select '{0}','{7}', {6}, 1, '{1}', '{2}', '{3}', '{4}', '{5}'
            WHERE NOT EXISTS ( SELECT * FROM books WHERE title='{0}')'''.format(tit, isbn, iurl, siurl, lang, year, rate, auth))
            conn.commit()
            cur.execute('''select max(id) from books''')
            row = cur.fetchone()
            id = row[0]
            cur.execute('''insert into ratings 
            select {0}, {1}, {2}
           where not exists (select * from ratings where book_id = {0} and user_id = {1})'''.format(id, user, rate))
            conn.commit()
            for k in range(len(tags)):
                cur.execute('''insert into tags(tag_name) select '{0}'
    where not exists (select tag_name from tags where tag_name = '{0}')'''.format(tags[k]))
            conn.commit()
            return render_template('success.html')
    else:
        return render_template('add.html', message = "user does not exits")


@app.route('/register/login', methods=['GET', 'POST'])
def reg_success():
    user = request.form['username']
    pw = request.form['password']
    conn = psycopg2.connect(database="postgres", user="postgres",
                            password="123post", host="127.0.0.1", port="5432")
    cur = conn.cursor()
    cur.execute('''select * from users where userid = {0}'''.format(user))
    row = cur.fetchone()
    if row:
        return render_template('register.html', message = "User already exists")
    else:
        cur.execute('''insert into users select {0},'{1}' '''.format(user, pw))
        conn.commit()
        return render_template('login.html')


@app.route('/user_page/<value>', methods=['GET', 'POST'])
def to_read(value): 
    user = value
    tit = request.form['read']
    conn = psycopg2.connect(database="postgres", user="postgres",
                            password="123post", host="127.0.0.1", port="5432")
    cur = conn.cursor()
    cur.execute('''insert into to_read select {0}, 
(select id from books where title ='{1}') 
where not exists 
(select * from to_read where user_id = {0} and book_id = (select id from books where title ='{1}'))'''.format(user, tit))
    cur.execute('''refresh materialized view average_rate with data; refresh materialized view leaderboard with data ''')
    conn.commit()
    return render_template('login.html')

@app.route('/user/rate/<value>', methods=['GET', 'POST'])
def read_book(value):
    id = request.form['rate']
    rate = request.form['rate_book']
    print(id, rate)
    conn = psycopg2.connect(database="postgres", user="postgres",
                            password="123post", host="127.0.0.1", port="5432")
    cur = conn.cursor()
    cur.execute('''insert into ratings select {0}, {1}, {2} 
where not exists 
(select * from ratings where book_id = {0} and rating={2} and user_id ={1});'''.format(id, value, rate))
    cur.execute('''update books set 
ratings_count = ratings_count+1, ratings_{1} = ratings_{1} +1 where id = {0}'''.format(id, rate))
    
    cur.execute('''refresh materialized view average_rate with data; refresh materialized view leaderboard with data ''')
    conn.commit()
    return render_template('login.html')


conn.commit()
conn.close()

if __name__ == "__main__":
    app.run()
