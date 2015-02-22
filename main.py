import os
import logging
import gevent
from flask import Flask, render_template, url_for, redirect
from flask_sockets import Sockets
import io

app = Flask(__name__)
path = os.getcwd()
app.config['DEBUG'] = True
sockets = Sockets(app)

@app.route('/', methods=['GET', 'POST'])
def main():
    return redirect(url_for('static', filename='index.html'))

@sockets.route('/submit')
def submit(ws):
    while not ws.closed:
        gevent.sleep()
        data = ws.receive()
        if data:
            ws.send("ayy lmao")
            wave_file = io.open("test.wav", "wb")
            wave_file.write(data)
            wave_file.close()
