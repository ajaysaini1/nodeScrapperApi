var request = require('request');
var express = require('express');
var cheerio = require('cheerio');
var app = express();

var contents = function(tag) {
  if (!tag || !tag.children) return tag;
  return contents(tag.children);
};

function sortChannels(text) {
	let Keywords = {};
	let Keywords_list = [];

	text.forEach(function (word) {
		if(word) {
			Keywords[word] = Keywords[word] || [];
		    Keywords[word].push([]);
		}
	})

	for(let prop in Keywords) {
		Keywords_list.push({
			name: prop,
			count: Keywords[prop].length
		});
	}

	Keywords_list.sort(function (a, b) {
		return a.count - b.count
	})

	return Keywords_list.reverse().slice(0, 5);

}

function extractHeadings (headings, identifier) {
	var actualHeadings = [];
	for (var prop in headings) {
		if(headings[prop].name == identifier) {
			var textnode = contents(headings[prop])[0];
			if(textnode) {
				var content = textnode.data;
				if(content) {
					actualHeadings.push({
						content: content.replace(/\s+/g, " ").replace(/[^a-zA-Z ]/g, ""),
						length: content.length
					})
				}
			}
		} 
	}
	return actualHeadings;
}


app.get('/', function(req, res) {
	var url = req.query.url;

	var load_start = Date.now();

	request(url, function (error, response, content) {

	  var $ = cheerio.load(content);

	  var title = $('title').text();
	  var body = $('body').text().replace(/\s+/g, " ").replace(/[^a-zA-Z ]/g, "");
	  var html = $('html')
	  var meta = $('meta');
	  var h1 =  $('h1');
	  var h2 =  $('h2');
	  var h3 =  $('h3');
	  var imgs = $('img');
	  var imgs_src = [];
	  var description = '';
	  var allText = body.toLowerCase().split(' ');
	  var ratio = content.length - body.toLowerCase().length  + ':' + body.toLowerCase().length;

	  var headings = {
	  	h1: extractHeadings(h1, 'h1'),
	  	h2: extractHeadings(h2, 'h2'),
	  	h3: extractHeadings(h3, 'h3')
	  }

	  for(var prop in imgs) {
	  	var elem = imgs[prop];

	  	if(elem.attribs && elem.attribs.src) {
	  		imgs_src.push(elem.attribs.src);
	  	}
	  }


	  for(var prop in meta) {
	  	var elem = meta[prop];

	  	if(elem.attribs && elem.attribs.name == 'description') {
	  		description = elem.attribs.content;
	  	}
	  }

	  var h1_length = h1.length;
	  var h2_length = h2.length;
	  var h3_length = h3.length;
	  
	  var keywords = sortChannels(allText);

	  res.json({
	  	'error': error,
	  	'statusCode': response && response.statusCode,
	  	'title': title,
	  	'title_length': title.length,
	  	'description': description,
	  	'description_length': description.length,
	  	'h1_length': h1_length,
	  	'h2_length':h2_length,
	  	'h3_length':h3_length,
	  	'imgs_src': imgs_src,
	  	'load_time': (Date.now() - load_start) / 1000,
	  	'keywords': keywords,
	  	'headings': headings,
	  	'ratio': ratio
	  })

	});

});

app.listen('8080');