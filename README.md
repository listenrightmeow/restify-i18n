restify-i18n
============

#### Restify-i18n middleware for your API


### Usage
```js
var i18n = require('restify-i18n'),
	restify = require('restify'),
	mongoose = require(cwd + '/api/database/mongo')(config),
	server = restify.createServer();

i18n.set('directory', '/api/i18n/');
server.use(i18n.locale);

require('./routes/example')(server, mongoose);

server.listen(8000);
```

### Dependencies

[accept-language](https://github.com/tinganho/node-accept-language)


#### Example scenario

Assuming scaffolding above (using mongoose as an example):


```js
// routes/example.js

module.exports = function(server, mongoose) {
	var i18n,
		cwd = process.cwd(),
		controller = require(cwd + '/api/controller/user')(mongoose);

	i18n = function(req, res, next) {
		if (!!req.locale.lang) {
			controller.user.i18 = {
				error : require(cwd + req.locale.directory + req.locale.lang + '/user/error')
			};
		}

		next();
	}

	server.get('/me', i18n, function(req, res, next) {
		controller.find(req, res, next);
	});

	server.post('/register', i18n, function(req, res, next) {
		controller.register(req, res, next);
	});
}
```

```js
// controller/user.js

var User = function(mongoose) {
	var cwd = process.cwd();

	this.user = require(cwd + '/api/models/user')(mongoose);
	this.model = mongoose.model(this.user.name, this.user.schema);
};

User.prototype.register = function(req, res, next) {
	var self = this;
	var user = new this.model({
		username : req.params.username,
		email : req.params.email,
		facebook : {
			id : req.params.facebook.id,
			token : req.params.facebook.token
		},
		name : {
			first : req.params.name.first,
			last : req.params.name.last
		},
		password : req.params.password,
		phone : req.params.phone
	});

	user.save(function(err, user) {
		if (err) {
			if (!err.hasOwnProperty('errors')) return next(err);

			return next(err.errors[Object.keys(err.errors)[0]]);
		}

		res.send(user.id);
		next();
	});
}

User.prototype.find = function(req, res, next) {
	var self = this,
		username = req.params.username;

	if (!username) return next(new Error(this.user.i18.error.username));

	this.model.findByUsername(username, function(err, user) {
		if (err) return next(err);
		else if (!user.length) return next(new Error(self.user.i18.error.none));

		res.send(user);
		next();
	});
}

module.exports = function(mongoose) {
	return new User(mongoose);
};
```

```js
// model/user.js

var Model = function(mongoose) {
	var self = this,
		cwd = process.cwd(),
		config = require(cwd + '/api/config');

	this.name = 'User';
	this.i18 = { error : require(cwd + '/api/i18n/en-US/user/error') };
	this.schema = new mongoose.Schema({
		username : { type: String, required: true, index: { unique: true } },
		email : { type: String, required: true, index: { unique: true }, lowercase: true, validate: [self.validate.email, self.i18.error.email] },
		facebook : {
			id : { type: String, required: true, index: { unique: true } },
			token : { type: String, required: true },
		},
		name : {
			first : { type: String, required: true, lowercase: true },
			last : { type: String, required: true, lowercase: true }
		},
		password : { type: String, required: true, validate: [self.validate.password, self.i18.error.password] },
		phone : { type: String, required: true, trim: true, minlength: 7, maxlength: 11, validate: [self.validate.phone, self.i18.error.phone] }
	});
}

Model.prototype.validate = {
	email : function(value) {
		return /^([\w\W]+)(\@)([\w]+)(.\w+)$/.test(value);
	},
	password : function(value) {
		var valid = true,
			validation = {
				specialcharacter : value.match(/[\W]/g),
				uppercase : value.match(/[A-Z]/g),
				digit : value.match(/[\d]/g)
			};

		for (var prop in validation) {
			if (!validation.hasOwnProperty(prop) || (!!validation[prop] && validation[prop].length >= 2)) continue;

			valid = false;
			break;
		}

		return valid;
	},
	phone : function(value) {
		return /^\d{10}$/.test(value);
	}
}

Model.prototype.statics = function() {
	this.schema.statics.findByUsername = function(username, callback) {
		return this.find({ username : username }, callback);
	}
}

module.exports = function(mongoose) {
	var model = new Model(mongoose);

	model.statics();
	return model;
}

```


```js
// i18n/en-US/user/error.js

module.exports = {
	email : 'Not a valid email address.',
	none : 'User not found.',
	password : 'Password is violating minimum requirement of documented constraints.',
	phone : 'Not a valid phone number.',
	username : 'Username required.'
}
```

#### Example File Structure

```
- root
	-- api
		--- i18n
			---- en-GB
				----- user
					------ error.js
			---- en-US
				----- user
					------ error.js
		--- server.js
	package.json
```


### Flow

Utilizing the restify use api, we are intercepting all requests looking for either a 'accept-language' cookie or header.

If either is returned and is different from the plugin default, we pragmatically overwrite the lang file for the path request used in the model.


#### API

```js
i18n.set('default', 'en-GB');
```

Default : 'en-US'

Overwriting the default language will adjust flow when calculating header/cookie differentiation at runtime.


```js
i18n.set('directory', '/api/i18n/');
```

Default : '/i18n/' of the node working directory

Overwriting the default language will detect wether the new directory exists at runtime. This will also affect how you load the js/json language file in the routing (shown in the example above).
