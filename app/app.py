from flask import Flask, jsonify, render_template , request
import models
from models import model
import psycopg2


app = Flask(__name__)
con = psycopg2.connect(" dbname='goodreads' user='postgres' host='localhost' password='sm123456'")
cur = con.cursor()


@app.route("/list_all_tags")                   # at the end point /
def list_all_tags():
    cur.execute('''select distinct title from books''')
    item = []
    row = cur.fetchone()
    while row is not None:
        item.append(row[0])
        row = cur.fetchone()
    return jsonify(item)
# call method hello
    #return render_template('home.html' , searchquery = item)
@app.route("/filtered_recommended_books")
def filtered_recommended_books():
    tags = request.args.get("tags")
    author = request.args.get("author")
    rating = request.args.get("rating")
    language = request.args.get("language")
    year = request.args.get("year")
    cur.execute("SELECT * FROM books where ")
    searchquery = []
    for i in range(10):
        searchquery.append(cur.fetchone())
    #print(searchquery)
    return render_template('recommended_books.html', recommended_books=searchquery)

@app.route("/get_book_info")
def get_book_info():
	book_name = request.args.get("book_name")
	#return jsonify(book_name)
	#cur.execute('''select distinct title from books''')
	#row = cur.fetchone()
	#book_name = row[0]
	#return book_name
	cur.execute('''SELECT * FROM books where title like %s ''',[book_name])
	query = cur.fetchall()
	return jsonify(query)
	#return render_template('book_info.html', book_data=query)

@app.route("/register")
def register():
	username = request.args.get("username")
	password = request.args.get("password")
	email_id = request.args.get("email_id")

	cur.execute('')

	return "registration successful"

@app.route("/login")
def login():
	username = request.args.get("username")
	password = request.args.get("password")

	cur.execute("Select * from USERS where username = %s and password = %s",[username,password])
	query = cur.fetchall()
	if len(query) == 1:
		return render_template(user.html, user_data = query)
	else:
		return "login unsuccessful"


@app.route("/sorting") # sorting based on parameter
def sorting():
	sorting_parameter = request.args.get("sorting_parameter")

	if sorting_parameter = 'ratings':
		cur.execute("Select * from USERS where username = %s and password = %s",[username,password])

	if sorting_parameter = 'ratings_count':
		cur.execute("Select * from USERS where username = %s and password = %s",[username,password])

	if sorting_parameter = 'publication_year':
		cur.execute("Select * from USERS where username = %s and password = %s",[username,password])

	if sorting_parameter = 'number_of_editions':
		cur.execute("Select * from USERS where username = %s and password = %s",[username,password])

	query = cur.fetchall()
	return jsonify(query)

@app.route("/leaderboard_tag") # person who has rated most books in a tag
def leaderboard_tag():
	tag = request.args.get("tag")
	cur.execute("Select * from USERS where username = %s and password = %s",[username,password])
	query = cur.fetchall()
	return jsonify(query)

@app.route("/leaderboard") # person who has rated most books generally
def leaderboard():
	cur.execute("Select * from USERS where username = %s and password = %s",[username,password])
	query = cur.fetchall()
	return jsonify(query)





#set html 



if __name__ == '__main__':
    app.run(debug=True)
