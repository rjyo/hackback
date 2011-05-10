Say Hello to HackBack
===
this bookmarklet leads you back to HackerNews

What Is This For?
---
Here's the usecase: You opened a HackerNews link from Twitter, Facebook, your favorite RSS reader, or etc. But there's no easy way to check the original post and comments on HN, which might be more valuable that the link itself.

This bookmarklet does one simple job: it brings you back to the comment page on HN.

Install The Bookmarket
---
Goto [HackBack](http://hackback.cloudfoundry.com) on Cloud Foundry and drag the bookmarklet to your browsers' bookmark bar.

Install On Cloud Foundry
---
Here is the how to install it on Cloud Foundry:

    gem install vmc
    vmc target api.cloudfoundry.com
    vmc login # if you've got the invitation, it's in your mail
    vmc push your_app
    vmc env-add your_app NODE_ENV=production

    # update your app
    vmc update your_app

    # check status/logs
    vmc stats your_app
    vmc logs your_app
