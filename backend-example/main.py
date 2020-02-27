from flask import Flask, request, jsonify
from flask_cors import CORS
from tools.db import Database


app = Flask(__name__)
CORS(app)
db = Database()
db.init_db()
db.create_db()
# Put some dummy results
items = [
    ('mt5090503', 'Anunay Arunav Pandey', 'MT'),
]
for item in items:
    db.insert_student(item)


@app.route('/student', methods=['GET', 'POST', 'PUT', 'DELETE'])
def get_all_students():
    if request.method == 'GET':
        students = db.fetch_all_students()
        res_data = []
        for student in students:
            res_data.append({
                'name': student[2],
                'college_id': student[1],
                'dep': student[3],
            })
        return jsonify(res_data)
    elif request.method == 'POST':
        data = request.get_json()
        college_id, name, department = data['college_id'],  data['name'], data['department']
        db.insert_student((college_id, name, department))
        return {"status": "ok"}
    elif request.method == 'PUT':
        data = request.get_json()
        college_id, name = data['college_id'],  data['name']
        db.update_student_by_id((name, college_id))
        return {"status": "ok"}
        # return jsonify({"student": db.fetch_student_by_id(college_id), "status": "ok"})
    elif request.method == 'DELETE':
        data = request.get_json()
        college_id = data['college_id']
        db.delete_student_query_by_id((college_id))
        return {"status": "ok"}


if __name__ == '__main__':
    app.run(debug=True)
