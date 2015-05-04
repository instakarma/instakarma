const nunjucks = require('nunjucks');
const moment   = require('moment');

const env = new nunjucks.Environment();

const filterMap = {
	fuzzyTimeSinceNow(date) {
		return moment(date).fromNow();
	},

    avatarUrl(user) {
        return user.avatar || 'https://robohash.org/' + user.id + '?size=80x80&bgset=bg1';
    },

    jsonString(obj) {
        return JSON.stringify(obj, null, 4);
    }
}

module.exports = filterMap;