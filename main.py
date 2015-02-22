import os
import logging
import gevent
from flask import Flask, render_template, url_for, redirect
from flask_sockets import Sockets
import io
import string
import random

app = Flask(__name__)
path = os.getcwd()
app.config['DEBUG'] = True
sockets = Sockets(app)

def rand_id(size=8):
    return ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(size))

@app.route('/', methods=['GET', 'POST'])
def main():
    return redirect(url_for('static', filename='index.html'))

@sockets.route('/submit')
def submit(ws):
    user_id = rand_id()
    while not ws.closed:
        gevent.sleep()
        data = ws.receive()
        if data and data != "start":
            file_name = "_".join(["file", user_id, rand_id()])
            wave_file = io.open(file_name, "wb")
            wave_file.write(data)
            wave_file.close()
            # process_file(file_name)
            # os.remove(file_name)
