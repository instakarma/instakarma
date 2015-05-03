const nunjucks = require('nunjucks');
const moment   = require('moment');

const env = new nunjucks.Environment();

const filterMap = {
	fuzzyTimeSinceNow(date) {
		return moment(date).fromNow();
	},

    avatarUrl(user) {
        return user.avatar || 'http://api.adorable.io/avatars/50/' + user.id + '.png'
    },

    jsonString(obj) {
        return JSON.stringify(obj, null, 4);
    }
}

module.exports = filterMap;