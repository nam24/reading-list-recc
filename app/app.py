from flask import Flask, render_template , request
import models
from models import model
import psycopg2

app = Flask(__name__)
con = psycopg2.connect(" dbname='goodreads' user='postgres' host='localhost' password='sm123456'")
cur = con.cursor()


@app.route("/")                   # at the end point /
def home():
    cur.execute('''select distinct title from books''')
    item = []
    row = cur.fetchone()
    while row is not None:
        item.append(row[0])
        row = cur.fetchone()

# call method hello
    return render_template('home.html' , searchquery = item)


@app.route("/search")
def get_query():
    query = request.args.get("search")
    print(query)
    cur.execute("SELECT * FROM books")
    searchquery = []
    for i in range(10):
        searchquery.append(cur.fetchone())
    #print(searchquery)
    return render_template('search.html', title='News', searchquery=searchquery)



#set html 



if __name__ == '__main__':
    app.run(debug=True)
