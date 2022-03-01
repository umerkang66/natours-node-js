const path = require('path');

// path.dirname() returns the directory name of the path
// require.main.filename is the file where node js runs its start script
module.exports = path.dirname(require.main.filename);
