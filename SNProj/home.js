var facebook = require("./facebook.js");
facebook.getFbData('CAACEdEose0cBAOGBg4EtI6rlKf1HADk9Y3kHRBhoLkGXCPfi3j7B9G0KvZAPMQDkNQRTs5bwCw2y3JHZAadXkIZAuxlmd35r3JXCm9ubNMwu8owxEwX6eICDcJCd8ZAV8EZAc1XDZBFPrycHjDmqv44feT1f3wJhTHygDl9xwuXR6ZC2vW2rZClpt7NE63KF0m6mHboCoEuIEwZDZD', '/me/friends', function(data){
    console.log(data);
});
