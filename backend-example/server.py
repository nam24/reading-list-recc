# This is a placeholder file

from flask import Flask, send_from_directory
import random
import json
from flask import jsonify

import urllib.request

app = Flask(__name__)
student_json_url = 'https://raw.githubusercontent.com/Korku02/iitd-userdata/master/js/student.json'
# Path for our main Svelte page
@app.route("/")
def base():
    return {'version': 1, 'author': 'Namrata Tripathi'}

# Path for all the static files (compiled JS/CSS, etc.)
@app.route("/<path:path>")
def home(path):
    return send_from_directory('client/public', path)


@app.route("/rand")
def hello():
    return str(random.randint(0, 100))


@app.route("/students")
def student_data():
    with urllib.request.urlopen('https://raw.githubusercontent.com/Korku02/iitd-userdata/master/js/student.json') as url:
        data = json.loads(url.read().decode())
        return jsonify(data)

@app.route('/manage_game', methods=['POST'])    
def manage_game():
    start = request.form['action'] == 'Start'
    game_id = request.form['game_id']
    return game_id


if __name__ == "__main__":
    app.run(debug=True)
