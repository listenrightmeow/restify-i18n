module.exports = function(name, cookies) {
	name = name.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');

	var regex = new RegExp('(?:^|;)\\s?' + name + '=(.*?)(?:;|$)','i'),
		match = cookies.match(regex);

	return match && unescape(match[1]);
}