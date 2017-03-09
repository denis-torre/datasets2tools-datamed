############################################################
############################################################
############### Datasets2Tools Web Interface ###############
############################################################
############################################################

#######################################################
########## 1. Setup Python ############################
#######################################################

##############################
##### 1.1 Python Libraries
##############################
import sys
import pandas as pd
from flask import Flask, request, render_template, send_file

##############################
##### 1.2 Custom Libraries
##############################

##############################
##### 1.3 Setup App
##############################
# Initialize Flask App
app = Flask(__name__)

#######################################################
########## 2. Setup Web Page ##########################
#######################################################

##############################
##### 2.1 Homepage
##############################

### 2.1.1 Main
@app.route('/datasets2tools')
def main():
	return render_template('index.html')

### 2.1.1 Main
@app.route('/datamedResults')
def datamedResults():
	return render_template('datamedResults.html')

### 2.1.1 Main
@app.route('/datamedLanding')
def datamedLanding():
	return render_template('datamedLanding.html')

### 2.1.1 Main
@app.route('/icons/copy.png')
def copy():
	return send_file('static/datasets2tools/icons/copy.png', mimetype='image/gif')

### 2.1.1 Main
@app.route('/icons/link.png')
def link():
	return send_file('static/datasets2tools/icons/link.png', mimetype='image/gif')

### 2.1.1 Main
@app.route('/icons/info.png')
def info():
	return send_file('static/datasets2tools/icons/info.png', mimetype='image/gif')

### 2.1.1 Main
@app.route('/icons/embed.png')
def embed():
	return send_file('static/datasets2tools/icons/embed.png', mimetype='image/gif')

### 2.1.1 Main
@app.route('/icons/icon_128.png')
def icon_128():
	return send_file('static/datasets2tools/icons/icon_128.png', mimetype='image/gif')

### 2.1.1 Main
@app.route('/icons/arrow-left.png')
def arrow_left():
	return send_file('static/datasets2tools/icons/arrow-left.png', mimetype='image/gif')

### 2.1.1 Main
@app.route('/icons/arrow-right.png')
def arrow_right():
	return send_file('static/datasets2tools/icons/arrow-right.png', mimetype='image/gif')

### 2.1.1 Main
@app.route('/icons/download.png')
def download():
	return send_file('static/datasets2tools/icons/download.png', mimetype='image/gif')

### 2.1.1 Main
@app.route('/icons/share.png')
def share():
	return send_file('static/datasets2tools/icons/share.png', mimetype='image/gif')

#######################################################
########## 3. Run Flask App ###########################
#######################################################
# Run App
if __name__ == "__main__":
	app.run(debug=True, host='0.0.0.0')