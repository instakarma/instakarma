const nunjucks = require('nunjucks');
const moment   = require('moment');

const env = new nunjucks.Environment();

const filterMap = {
	fuzzyTimeSinceNow(date) {
		return moment(date).fromNow();
	}
}

module.exports = filterMap;