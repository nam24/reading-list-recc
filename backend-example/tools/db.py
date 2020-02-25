import sqlite3
import os
from tools.queries import create_students_table_query, \
    insert_students_query, get_all_students_query, get_student_by_college_id_query, \
    update_student_by_college_id_query, delete_student_query

DB_FILEPATH = os.path.join(str(os.getcwd()), 'test.db')


class Database(object):
    def init_db(self, persist=False):
        try:
            if persist:
                print("Connecting to {}".format(DB_FILEPATH))
                self.conn = sqlite3.connect(
                    DB_FILEPATH, check_same_thread=False)
            else:
                print("Connecting to in memory db")
                self.conn = sqlite3.connect(
                    ':memory:', check_same_thread=False)
        except Exception:
            raise Exception("Unable to connect to DB")

    def create_db(self):
        cur = self.conn.cursor()
        cur.execute(create_students_table_query)
        self.conn.commit()

    def insert_student(self, student):
        cur = self.conn.cursor()
        try:
            cur.execute(insert_students_query, student)
            self.conn.commit()
        except sqlite3.Error as e:
            if "UNIQUE" in "{}".format(e):
                pass
            else:
                raise Exception("Error while inserting student {}".format(e))
        except Exception as e:
            raise Exception("Error while executing query: {}".format(e))

    def fetch_all_students(self):
        cur = self.conn.cursor()
        try:
            cur.execute(get_all_students_query)
        except sqlite3.Error as e:
            raise Exception("Error while fetching student: {}".format(e))
        except Exception as e:
            raise Exception("Error while executing query: {}".format(e))
        return cur.fetchall()

    def fetch_student_by_id(self, college_id):
        cur = self.conn.cursor()
        try:
            cur.execute(get_student_by_college_id_query, college_id)
        except sqlite3.Error as e:
            raise Exception("Error while fetching student: {}".format(e))
        except Exception as e:
            raise Exception("Error while executing query: {}".format(e))
        return cur.fetchall()

    def update_student_by_id(self, student):
        cur = self.conn.cursor()
        try:
            cur.execute(update_student_by_college_id_query, student)
            self.conn.commit()
        except sqlite3.Error as e:
            if "UNIQUE" in "{}".format(e):
                pass
            else:
                raise Exception("Error while updating student {}".format(e))
        except Exception as e:
            raise Exception("Error while executing query: {}".format(e))

    def delete_student_query_by_id(self, id):
        cur = self.conn.cursor()
        try:
            cur.execute(delete_student_query, id)
            self.conn.commit()
        except sqlite3.Error as e:
            if "UNIQUE" in "{}".format(e):
                pass
            else:
                raise Exception("Error while deleting student {}".format(e))
        except Exception as e:
            raise Exception("Error while executing query: {}".format(e))
