Notr
====

Notr provides a text-based interface for managing URL-based metadata such as
tags, associated links, and public notes. All content submitted using notr.info
is accessible to other Notr users.

Notr is currently only available for Google Chrome (desktop). It has been
tested and should work on Windows, OS X, and Linux.


Using Notr
==========

Once the Chrome extension is installed, it can be activated by pressing the Ctrl
or Cmd key twice (tap-tap). A popup window should appear similar to the one below.

![Alt text](https://raw.githubusercontent.com/scovetta/notr/master/images/screenshot-1.png "Screenshot")

Whenever a command is typed and you press 'enter', a command is sent to the Notr
server (https://notr.info), and a response is returned back to you. No caching
is currently in place.


Security & Privacy
==================

When Notr is installed, one of the first things the extension does is to generate
a long random identifier. This will be used when interacting with the web-service
for a few reasons:

*   To prevent and recover from abuse (malicious, spam, harassing, etc.)
*   To enable per-user features such as a personal "read later" list.

A future version will likely enable more robust authentication (such as using
OAuth) for an enhanced user experience.

The Notr back-end service stores the following information:

*   Standard web server logs (URLs, source IP addresses, etc.)
*   The unique identifier described above
*   The actual URL and textual content submitted


Acknowledgements
================

I'd like to acknowledge the following resources leveraged by this extension.

*   images/flag.png: http://veryicon.com/icons/system/farm-fresh/flag-red-1.html
*   images/notr-logo-*.png: http://veryicon.com/icons/system/blawb/notes-14.html
*   jQuery
*   Lots of examples from Stack Overflow

Contact
=======

Feel free to contact me via my Github contact page.


