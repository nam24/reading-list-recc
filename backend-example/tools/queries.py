# create table queries
create_students_table_query = """
CREATE TABLE IF NOT EXISTS students(id INTEGER PRIMARY KEY AUTOINCREMENT,
college_id VARCHAR UNIQUE, name VARCHAR, department VARCHAR)
"""

# insert records queries
insert_students_query = """
INSERT INTO students(college_id, name, department) VALUES (?,?,?)
"""

# analytics queries
get_total_students_query = """
SELECT count(college_id) from students
"""

get_all_students_query = """
SELECT * FROM students
"""
get_student_by_college_id_query = """
SELECT * FROM students WHERE college_id=?
"""

update_student_by_college_id_query = """
UPDATE students SET name=? WHERE college_id = ?;
"""

delete_student_query = """
DELETE FROM students WHERE college_id = ?;
"""
