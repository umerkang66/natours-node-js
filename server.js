const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: './config.env' });

// START THE SERVER
const port = process.env.PORT || 3000;
app.listen(port, () => {
  // console.log(`APP RUNNING ON PORT ${port}...`);
});
