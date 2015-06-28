var cwd = process.cwd();
var fs = require('fs');
var path = require('path');
var lang = require('accept-language');
var cookieParser = require(cwd + '/node_modules/restify-i18n/helpers/cookies');

var I18n = function() {
	this.default = 'en-US';
	this.directory = '/i18n/';

	this.directories = function() {
		var self = this;

		return fs.readdirSync(cwd + this.directory).filter(function(file) {
			return fs.statSync(path.join(cwd + self.directory, file)).isDirectory();
		});
	}.bind(this);

	this.set = function(property, value) {
		this[property] = value;
	}.bind(this);

	this.locale = function(req, res, next) {
		var self = this,
			header = req.headers['accept-language'],
			cookie = !!req.headers.cookie ? cookieParser('accept-language', req.headers.cookie) : null,
			locale = (!!cookie && (!!header && cookie === header)) ? cookie : !!header ? header : this.default;

		lang.languages(this.directories());
		locale = lang.get(locale);

	 	req.locale = {
	 		default : this.default,
	 		directory : this.directory,
			lang : (locale !== this.default && locale !== cookie) ? this.supported(res, locale) : (!!cookie) ? locale : null
	 	};

		next();	
	}.bind(this);

	this.supported = function(res, locale) {
		try {
			fs.readdirSync(cwd + this.directory + locale);
		} catch(error) {
			locale = this.default;
		}

		res.setCookie('accept-language', locale);
		return locale;
	}.bind(this);
};

module.exports = new I18n();