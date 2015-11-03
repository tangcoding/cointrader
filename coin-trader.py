#!/usr/bin/python

Site = 'Coin-Trader'
Logo = '<img src="../../pics/logo.png" />'

Client_ID_CoinBase = 'f95809f2fc94a111ca80a9f90a8343ad169d1a6e523fffc9dfa94d9946956c8e'
Client_Secret_CoinBase = '51a9ed9032d34b66666b34781e83ff066da229ee76f8b2ab96be1a3b107efbc3'

Colors = '''
    $base03:    #002b36;
    $base02:    #073642;
    $base01:    #586e75;
    $base00:    #657b83;
    $base0:     #839496;
    $base1:     #93a1a1;
    $base2:     #eee8d5;
    $base3:     #fdf6e3;
    $yellow:    #b58900;
    $orange:    #cb4b16;
    $red:       #dc322f;
    $magenta:   #d33682;
    $violet:    #6c71c4;
    $blue:      #268bd2;
    $cyan:      #2aa198;
    $green:     #859900;
'''

Analytics = '''<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
  ga('create', 'UA-46142573-1', 'coin-trader.appspot.com');
  ga('send', 'pageview');
</script>'''

  # - System
import os
import os.path
import cgi
import json
import urllib
import urllib2
import webapp2
import facebook
import datetime
import wsgiref.handlers
from random import randint
import time
import csv

  # - Appengine
from google.appengine.api import users
from google.appengine.api import mail
from google.appengine.api import images
from google.appengine.api import memcache
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext import db
from google.appengine.ext import ndb

from pytz.gae import pytz
  # -
from google.appengine.ext import db
from google.appengine.ext import blobstore
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.ext.webapp.util import run_wsgi_app
from urlparse import urlparse
from webapp2_extras import sessions

from google.appengine.api import urlfetch



# config = {}
# config['webapp2_extras.sessions'] = dict(secret_key='yuszaecdtzaeuzniczatep4dticzc')

class publicSite(webapp2.RequestHandler):
    def get(self):
        date_time = datetime.datetime.now(pytz.timezone('US/Mountain')).strftime("%m/%d '%y &nbsp; %H:%M")
        user = users.get_current_user()
        if user:
            login_key = users.create_logout_url(self.request.uri)
            gate =  'logout'
            admin = ''
            if users.is_current_user_admin():
                admin = 'yes'
        else:
            login_key = users.create_login_url(self.request.uri)
            gate =  'login'
            admin = ''
        site = Site
        logo = Logo
        analytics = Analytics

        CoinBase_Buy_url = 'https://coinbase.com/api/v1/prices/buy'
        CoinBase_Sell_url = 'https://coinbase.com/api/v1/prices/sell'
        BitStamp_url = 'https://www.bitstamp.net/api/ticker/'
        btce_url = 'https://btc-e.com/api/2/btc_usd/ticker'
        coindesk_url = 'https://api.coindesk.com/v1/bpi/currentprice.json'

        CoinBase_Buy_result = urlfetch.fetch(CoinBase_Buy_url)
        if CoinBase_Buy_result.status_code == 200:
            CoinBase_Buy = CoinBase_Buy_result.content
            # print type(CoinBase_Buy)
        else:
            CoinBase_Buy = ''

        CoinBase_Sell_result = urlfetch.fetch(CoinBase_Sell_url)
        if CoinBase_Sell_result.status_code == 200:
            CoinBase_Sell = CoinBase_Sell_result.content
        else:
            CoinBase_Sell = ''

        BitStamp_prices_result = urlfetch.fetch(BitStamp_url)
        if BitStamp_prices_result.status_code == 200:
            BitStamp_prices = BitStamp_prices_result.content
        else:
            BitStamp_prices = ''

        btce_prices_result = urlfetch.fetch(btce_url)
        if btce_prices_result.status_code == 200:
            btce_prices = btce_prices_result.content
        else:
            btce_prices = ''

        coindesk_result = urlfetch.fetch(coindesk_url)
        if btce_prices_result.status_code == 200:
            #coindesk_result = coindesk_result.content
            coindesk_result = json.loads(coindesk_result.content)
            # print "lala:", coindesk_result
            usd_rate = str(coindesk_result['bpi']['USD']['rate'])
            # print "lala:", usd_rate
            # print type(usd_rate)
        else: 
            usd_rate = ''

    # - template
        objects = {
            'Site': site,
            'Logo': logo,
            'login_key': login_key,
            'gate': gate,
            'user': user,
            'coinbase_buy': CoinBase_Buy,
            'coinbase_sell': CoinBase_Sell,
            'bitstamp_prices': BitStamp_prices,
            'btce_prices': btce_prices,
            'usd_rate': usd_rate,
            'analytics': analytics,
            'date_time': date_time,
      }
    # - render
        path = os.path.join(os.path.dirname(__file__), 'html/publicSite.html')
        self.response.out.write(template.render(path, objects))

class CoinPrice_db(ndb.Model):
    file_name = ndb.StringProperty()
    update_time = ndb.StringProperty()
    data = ndb.JsonProperty()

class Add_hourly_price(webapp2.RequestHandler):
    def get(self):

        BitStamp_url = 'https://www.bitstamp.net/api/ticker/'

        result = urlfetch.fetch(BitStamp_url)
        if result.status_code == 200:
            price = json.loads(result.content);
        else:
            price = ''

        # price["timestamp"]=datetime.datetime.fromtimestamp(int(price["timestamp"])).strftime('%m/%d/%y')

        # price["timestamp"]=datetime.datetime.fromtimestamp(int(price["timestamp"])).strftime('%m/%d/%y %H:%M')
        data_hour = datetime.datetime.fromtimestamp(int(price["timestamp"])).hour  
        # ready for converting to date object in js
        price["timestamp"]=int(price["timestamp"])*1000
        item = CoinPrice_db.get_by_id("daily_data")

        new_data = {"hour": data_hour, "date": price["timestamp"], "open": price["open"], "high": price["high"], "low": price["low"], "close": price["last"], "volume_currency": price["volume"], "weighted_price": price["vwap"]} 

        print new_data 

        if item != None:
            data =json.loads(item.data)

            found = False
            for obj in data:
                if obj["hour"] == data_hour:
                    obj = new_data
                    found = True
                    break
            if not found:
                data.append(new_data)

        else:
            file_name = "daily_data"
            item = CoinPrice_db(id=file_name)
            item.file_name = file_name
            data = []
            data.append(new_data)

        item.updated_time = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        item.data = json.dumps(data)
        item.put()


class Price_data(webapp2.RequestHandler):
    def get(self):
        page_address = self.request.uri
        base = os.path.basename(page_address)

        start_time= base.split('?')[1];
        end_time = base.split('?')[2];
        # print "start_time",start_time
        start_time = int(float(start_time));
        end_time = int(float(end_time));

        data_interval = 1
        if (end_time - start_time) > 864000: # time range is larger than 10 days
            data_interval = 6
        elif (end_time - start_time) > 2592000: # time range is larger than 30 days
            data_interval = 24

        start_year = datetime.datetime.fromtimestamp(int(start_time)).year;
        # print start_year
        end_year = datetime.datetime.fromtimestamp(int(end_time)).year;     
        # print current_year
 
        year_arrary = []
        for i in range(start_year, end_year+1):
            year_arrary.append(i)

        # print year_arrary

        price_data = []
        for year in year_arrary:
            item = Price_db.get_by_id(str(year))
            if item != None:
                data = json.loads(item.data)

                if start_year != end_year:                    
                    if year == start_year:
                        for i in range(0, len(data), data_interval):
                            if data[i]['updated_time'] > start_time:
                                price_data.append(data[i])
                    elif year == end_year:
                        for i in range(0, len(data), data_interval):
                            if data[i]['updated_time'] < end_time:
                                price_data.append(data[i])
                    else:
                        for i in range(0, len(data), data_interval):                  
                            price_data.append(data[i])

                else:
                    for i in range(0, len(data), data_interval):  
                        if data[i]['updated_time'] < end_time and data[i]['updated_time'] > start_time:
                            price_data.append(data[i])                  

        # db_data = db.Query(Price_db, projection=('updated_time', 'buy_price', 'sell_price'))
        # db_data.order("-updated_time")

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(price_data))


class Price_data_all_old(webapp2.RequestHandler):
    def get(self):
        page_address = self.request.uri
        base = os.path.basename(page_address)

        start_year = 2015;
        now = datetime.datetime.now()
        end_year = now.year     

        year_arrary = []
        for i in range(start_year, end_year+1):
            year_arrary.append(i)

        price_data = []
        data_interval = 12

        price_data = []
        for year in year_arrary:
            item = Price_db.get_by_id(str(year))
            if item != None:
                data = json.loads(item.data)

                for i in range(0, len(data), data_interval):  
                    price_data.append(data[i])                                

        # db_data = db.Query(Price_db, projection=('updated_time', 'buy_price', 'sell_price'))
        # db_data.order("-updated_time")

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(price_data))

class Price_data_all(webapp2.RequestHandler):
    def get(self):
        page_address = self.request.uri
        base = os.path.basename(page_address)

        price_data = []
        item1 = CoinPrice_db.get_by_id("all_data")
        item2 = CoinPrice_db.get_by_id("daily_data")
        # print item.file_name
        # print item.data
        if item1 != None: 
            data = json.loads(item1.data)
            if item2 != None:
                data.extend(json.loads(item2.data))
            self.response.headers['Content-Type'] = 'application/json'
            self.response.out.write(json.dumps(data))                   

class Add_daily_price(webapp2.RequestHandler):
    def get(self):

        BitStamp_url = 'https://www.bitstamp.net/api/ticker/'

        result = urlfetch.fetch(BitStamp_url)
        if result.status_code == 200:
            price = json.loads(result.content);
        else:
            price = ''

        price["timestamp"]=datetime.datetime.fromtimestamp(int(price["timestamp"])).strftime('%m/%d/%y')
        item = CoinPrice_db.get_by_id("all_data")

        new_data ={"date": price["timestamp"], "open": price["open"], "high": price["high"], "low": price["low"], "close": price["last"], "volume_currency": price["volume"], "weighted_price": price["vwap"]}   

        if item != None:
            data =json.loads(item.data)
            data.append(new_data)

            item.data = json.dumps(data)
            item.updated_time = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            item.put()


class export_data(webapp2.RequestHandler):
    def get(self):
        json_data = {'data':[]}

        db_data = db.Query(Price_db, projection=('updated_time', 'buy_price', 'sell_price'))

        data = []
        for f in db_data:
            data.append({'updated_time':f.updated_time, 
                                   'buy_price':f.buy_price,
                                   'sell_price':f.sell_price})
            # data.append(db.to_dict(f))

        json_data['data'] = data
        item = CoinPrice_db(id=str(2015))
        item.data = json.dumps(json_data)
        item.put()

        # self.response.headers['Content-Type'] = 'application/json' 
        # self.response.headers['Content-Disposition'] = 'attachment; filename=price.json'
        # self.response.out.write(json.dumps(json_data))

class export_data2(webapp2.RequestHandler):
    def get(self):

        item = CoinPrice_db.get_by_id(str(2015))
        db_data = json.loads(item.data)
        # self.response.headers['Content-Type'] = 'application/json' 
        # self.response.out.write(json.dumps(db_data))

        for f in db_data['data']:
            f['updated_time'] = int(f['updated_time'])

        new_data = sorted(db_data['data'], key=lambda k: k['updated_time']) 

        self.response.headers['Content-Type'] = 'application/json' 
        self.response.out.write(json.dumps(new_data))

        item = Price_db(id=str(2015))
        item.data = json.dumps(new_data)
        item.put()

class import_data(webapp2.RequestHandler):
    def post(self):

        filename = "all_data"        
        item = CoinPrice_db(id=filename)
        item.file_name = "all_data" 
        item.update_time = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_file = self.request.get("csv_file")

        fileReader = csv.reader(csv_file.split("\n"))

        
        data = []
        for row in fileReader:
            if len(row) > 0:
                if row[0] ==  "Date":
                    continue
                data.append({"date": row[0], "open": row[1], "high": row[2], "low": row[3], "close": row[4],
                             "volume_btc": row[5], "volume_currency": row[6], "weighted_price": row[7]});

        new_data = sorted(data, key=lambda k: k['date']) 

        item.data = json.dumps(new_data)
        item.put()


app = webapp2.WSGIApplication([
	    ('/', publicSite),
        ('/add_hourly_price/?', Add_hourly_price),
        ('/price_data_all/?', Price_data_all),
        ('/import_json/?', import_data),
        ('/add_daily_price/?', Add_daily_price),
], debug=True)
    # config=config)
