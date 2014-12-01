/*!
 * Notr (http://notr.negativefoo.org)
 * Copyright 2014 Negativefoo.org
 * Licensed under 2-Clause BSD.
 */

function Notr() {
    "use strict";

    this.VERSION = 1.0;

    /* Contains all commands installed */
    this.command_list = [];

    /* Unique identifier for this installation */
    this.installation_id = null;

    /* Generic configuration */
    this.config = {
        'trigger_keycodes': [17, 91],
        'keypress_timeout': 500
    };

    /**
     * Registers a command so it can be taken from user input.
     * Note that multiple commands can be registered to execute
     * on the same input.
     * @test_func => function to determine whether the input
     *               string matches.
     * @exec_func => function to execute if the input string
     *               matches.
     * @return    => true iff successful
     */
    this.register_command = function(options) {
        if (typeof options['test'] !== "function" ||
            typeof options['execute'] !== "function") {
            return false;
        }

        if (this.command_list === null) {
            this.command_list = [];
        }

        this.command_list.push(options);
        return true;
    };

    /**
     * Processes input (when the user presses 'enter').
     * @cmd => Command line (full) entered by the user
     * @return => true iff processing completed successfully.
     */
    this.process_input = function(cmd) {
        if (cmd === null || cmd.toString().trim().toLowerCase() === '') {
            return false;
        }

        var did_execute = false;
        var cmd_clean = cmd.toLowerCase().trim();

        var $dollar = $('<span class="command_marker">$ </span>');
        this.send_output($dollar[0].outerHTML + cmd, '#839496', true);

        for (var registration of this.command_list) {
            var test_func = registration['test'];
            var exec_func = registration['execute'];

            if (typeof test_func === "function" &&
                typeof exec_func === "function" &&
                test_func(cmd, cmd_clean) === true) {
                exec_func(cmd, cmd_clean);
                did_execute = true;
            }
        }
        if (!did_execute) {
            this.send_output('Command not recognized. Type \'help\' for available commands.', '#b58900');
            return false;
        }
        return true;
    }

    this.get_current_url = function() {
        return location.href;
    };



    this.register_builtins = function() {
        var that = this;

        /* "help" */
        this.register_command({
            'usage': 'help',
            'description': 'show help/usage information',
            'test': function(cmd, cmd_clean) {
                return cmd_clean === 'help';
            },
            'execute': function(cmd, cmd_clean) {
                var output = [];
                var max_usage_length = 0;
                for (var reg of that.command_list) {
                    if (reg['usage'].length > max_usage_length) {
                        max_usage_length = reg['usage'].length;
                    }
                }

                for (var reg of that.command_list) {
                    var $usage = $('<span class="help_usage"></span>')
                    $usage.text(reg['usage'].pad(' ', max_usage_length, true));

                    var $description = $('<span class="help_description"></span>');
                    $description.text(reg['description']);

                    var line = $usage[0].outerHTML + '  ' + $description[0].outerHTML;
                    output.push(line);
                }
                output = output.sort();
                that.send_output(output);
            }
        });

        /* "add tag foo" */
        this.register_command({
            'usage': 'tag [<tag> [<tag> ...]]',
            'description': 'attach tags to this url (public)',
            'test': function(cmd, cmd_clean) {
                return cmd_clean.indexOf('tag ') === 0;
            },
            'execute': function(cmd, cmd_clean) {
                var tags = cmd.split(' ').slice(1);
                $.ajax({
                    dataType: "json",
                    url: "http://notr.negativefoo.org/index.php",
                    type: 'POST',
                    data: {'action': 'add_tags',
                           'url': that.get_current_url(),
                           'unique_id': that.installation_id,
                           'tags': tags},
                }).always(function(d, s, x) {
                    if (d && d['result'] === 'success') {
                        var tags = $.map(d['data'], function(m) {
                            return m['tag'];
                        });
                        if (!links.length) {
                            that.send_output("Sorry, this URL does not have any tags.");
                        } else {
                            that.send_output(tags.join(' '));
                        }
                    } else {
                        that.send_output('Error: ' + s, '#dc322f');
                    }
                });
            }
        });

        /* "get tags" */
        this.register_command({
            'usage': 'tags',
            'description': 'show tags for this url',
            'test': function(cmd, cmd_clean) {
                return cmd_clean === "tags";
            },
            'execute': function(cmd, cmd_clean) {
                $.ajax({
                    dataType: "json",
                    url: "http://notr.negativefoo.org/index.php",
                    type: 'POST',
                    data: {'action': 'get_tags',
                           'installation_id': that.installation_id,
                           'url': that.get_current_url()},
                }).always(function(d, s, x) {
                    if (d && d['result'] === 'success') {
                        var tags = $.map(d['data'], function(m) {
                            return m['tag'];
                        });

                        if (!tags.length) {
                            that.send_output("Sorry, this URL does not have any tags.");
                        } else {
                            that.send_output(tags.join(' '));
                        }
                    } else {
                        that.send_output('Error: ' + s, '#dc322f');
                    }
                });
            }
        });

        /* "add link <link>" */
        this.register_command({
            'usage': 'link <url>',
            'description': 'links this url to another url',
            'test': function(cmd, cmd_clean) {
                return cmd_clean.indexOf('link ') === 0;
            },
            'execute': function(cmd, cmd_clean) {
                var link = cmd.split(' ').slice(1).join('');
                $.ajax({
                    dataType: "json",
                    url: "http://notr.negativefoo.org/index.php",
                    type: 'POST',
                    data: {'action': 'add_link',
                           'installation_id': that.installation_id,
                           'url': that.get_current_url(),
                           'link': link},
                }).always(function(d, s, x) {
                    if (d && d['result'] === 'success') {
                        var links = $.map(d['data'], function(m) {
                            return m['link'];
                        });
                        that.send_output('Links: ' + links.join(' '));
                    } else {
                        that.send_output('Error: ' + s, '#dc322f');
                    }
                });
            }
        });

        /* "get links" */
        this.register_command({
            'usage': 'links',
            'description': 'show urls this url is linked with',
            'test': function(cmd, cmd_clean) {
                return cmd_clean === 'links';
            },
            'execute': function(cmd, cmd_clean) {
                $.ajax({
                    dataType: "json",
                    url: "http://notr.negativefoo.org/index.php",
                    type: 'POST',
                    data: {'action': 'get_links',
                           'url': that.get_current_url()},
                }).always(function(d, s, x) {
                    if (d && d['result'] === 'success') {
                        that.send_output($.map(d['data'], function(item) {
                            var $link = $('<span class="link"><a></a></span>');
                            var $a = $link.find('a');
                            $a.attr('href', item['url']);
                            $a.attr('target', '_blank');
                            $a.text(item['url']);
                            return $link[0].outerHTML;
                        }));
                    } else {
                        that.send_output('Error: ' + s, '#dc322f');
                    }
                });
            }
        });

        /* Read Later */
        this.register_command({
            'usage': 'later | l',
            'description': 'saves url to reading list for later',
            'test': function(cmd, cmd_clean) {
                return cmd_clean === 'later' || cmd_clean === "l";
            },
            'execute': function(cmd, cmd_clean) {
                $.ajax({
                    dataType: "json",
                    url: "http://notr.negativefoo.org/index.php",
                    type: 'POST',
                    data: {'action': 'add_read_later',
                           'url': that.get_current_url(),
                           'installation_id': that.installation_id},
                }).always(function(d, s, x) {
                    if (d && d['result'] === 'success') {
                        var num = d['data'].length || 0;
                        that.send_output('Reading list now contains ' + num + ' items.');
                    } else {
                        that.send_output('Error: ' + s, '#dc322f');
                    }
                });
            }
        });

        /* "show reading list" */
        this.register_command({
            'usage': 'laters [<query>] | ls [<query>]',
            'description': 'shows reading list, optionally searching for <query>',
            'test': function(cmd, cmd_clean) {
                return (cmd_clean === 'laters' ||
                        cmd_clean === 'ls' ||
                        cmd_clean.indexOf('laters ') === 0 ||
                        cmd_clean.indexOf('ls ') === 0);
            },
            'execute': function(cmd, cmd_clean) {
                var search = cmd.split(' ').slice(1).join(' ') || null;
                $.ajax({
                    dataType: "json",
                    url: "http://notr.negativefoo.org/index.php",
                    type: 'POST',
                    data: {'action': 'get_read_later',
                           'search': search,
                           'installation_id': that.installation_id},
                }).always(function(d, s, x) {
                    if (d && d['result'] === 'success') {
                        var urls = $.map(d['data'], function(m) {
                            return [m['url'], m['tag_list']];
                        });
                        if (!urls.length) {
                            that.send_output("Sorry, this URL does not have any linked URLs.");
                            return;
                        } else {
                            that.send_output($.map(d['data'], function(item) {
                                var $a = $('<a></a>');
                                $a.attr('href', item['url']);
                                $a.attr('target', '_blank');
                                $a.text(item['url']);
                                var $tg = $('<span class="later_tags">' +
                                            '<span class="later_tags_bracket">[ </span>' +
                                            '<span class="later_tags_content"></span>' +
                                            '<span class="later_tags_bracket"> ]</span>');
                                $tg.find('.later_tags_content')
                                   .text(item['tag_list'].join(' '));
                                return $a[0].outerHTML + $tg[0].outerHTML;
                            }));
                        }
                    } else {
                        that.send_output('Error: ' + s, '#dc322f');
                    }
                });
            }
        });

        /* Notes */
        this.register_command({
            'usage': 'note <note> | n <note>',
            'description': 'adds a text note to this url (public)',
            'test': function(cmd, cmd_clean) {
                return cmd_clean.indexOf('note ') === 0 || cmd_clean.indexOf('n ') === 0;
            },
            'execute': function(cmd, cmd_clean) {
                var note = cmd.split(' ').slice(1).join(' ');
                $.ajax({
                    dataType: "json",
                    url: "http://notr.negativefoo.org/index.php",
                    type: 'POST',
                    data: {'action': 'add_note',
                           'url': that.get_current_url(),
                           'installation_id': that.installation_id,
                           'note': note
                    },
                }).always(function(d, s, x) {
                    if (d && d['result'] === 'success') {
                        that.send_output('Note has been added successfully.');
                    } else {
                        that.send_output('Error: ' + s, '#dc322f');
                    }
                });
            }
        });

        /* Notes */
        this.register_command({
            'usage': 'notes [<query>] | ns [<query>]',
            'description': 'shows all notes for this url (search optional)',
            'test': function(cmd, cmd_clean) {
                return (cmd_clean === 'notes' ||
                        cmd_clean === 'ns' ||
                        cmd_clean.indexOf('notes ') === 0 ||
                        cmd_clean.indexOf('n ') === 0);
            },
            'execute': function(cmd, cmd_clean) {
                var search = cmd.split(' ').slice(1).join(' ');
                $.ajax({
                    dataType: "json",
                    url: "http://notr.negativefoo.org/index.php",
                    type: 'POST',
                    data: {'action': 'get_notes',
                           'url': that.get_current_url(),
                           'installation_id': that.installation_id,
                           'search': search
                    },
                }).always(function(d, s, x) {
                    if (d && d['result'] === 'success') {
                        if (!d['data'].length) {
                            that.send_output("Sorry, this URL does not have any notes.");
                            return;
                        }
                        that.send_output($.map(d['data'], function(item) {
                            var $note_text = $('<span class="note_text"></span>');
                            $note_text.text(' "' + item['note'] + '"');
                            var $note_date = $('<span class="note_date"></span>');
                            $note_date.text(new Date(Date.parse(item['created_dt'])).toDateString());
                            var $flag_link = $('<img title="Flag this note as inappropriate" class="flag" src="' +
                                               chrome.extension.getURL('images/flag.png') +
                                               '" alt="flag"/>');
                            $flag_link.on('click', function(evt) {
                                $.ajax({
                                    dataType: "json",
                                    url: "http://notr.negativefoo.org/index.php",
                                    type: 'POST',
                                    data: {'action': 'flag_note',
                                           'url': that.get_current_url(),
                                           'note': item['note'],
                                           'installation_id': that.installation_id
                                    },
                                }).always(function(d, s, x) {
                                    that.send_output('Thanks for flagging!', '#dc322f');
                                });
                                evt.preventDefault();
                                return false;
                            });
                            return $('<div></div>').append($note_text)
                                .append($note_date).append($flag_link);
                        }));
                    } else {
                        that.send_output('Error: ' + s, '#dc322f');
                    }
                });
            }
        });
    };
    this.send_output = function(output, color, suppress_newline) {
        output = typeof output === 'string' ? [output] : output;
        if (!suppress_newline) {
            output.push('');
        }
        var $ob = $('#cc1214 div#output_box');
        for (var line in output) {
            var $div = $('<div class="output_line"></div>');
            if (!!color) {
                $div.css('color', color);
            }
            $div.html(output[line]);
            $ob.append($div);
        }
        $ob.scrollTop($ob[0].scrollHeight);
    }

    /**
     * Hides the popup window.
     */
    this.hide = function() {
        $('#cc1214 input#input_box').val('');
        $('#cc1214').fadeOut(100);
        $('div#logo').fadeOut(100);
    }

    /**
     * Shows the popup window.
     */
    this.show = function() {
        $('#cc1214').fadeIn(100, function() {
            $('#cc1214 div.logo').fadeIn(500);
            $('#cc1214 input#input_box').focus();
        });
    }

    /**
     * Toggles the popup window.
     */
    this.toggle = function() {
        var that = this;

        // if it's visible, then hide it
        if ($('#cc1214').is(':visible')) {
            this.hide();
            return;
        }

        // if it's hidden, then show it
        if ($('#cc1214').length) {
            this.show();
            return;
        }

        // we need to create it
        var $popup =      $('<div id="cc1214"></div>');
        var $output_box = $('<div id="output_box"></div>');

        var $command_marker = $('<span class="input_command_marker">$</span>');
        var $input_box = $('<input type="text" id="input_box" />');
        $input_box.on('keyup', function(evt) {
            if (evt.keyCode === 13 /* Enter */) {
                that.process_input($(this).val());
                $('#cc1214 input#input_box').val('');
            }
        });

        var $close = $('<div id="close">x</div>');
        $close.on('click', function(evt) {
            that.hide();
        });

        var $logo = $('<div class="logo"><div><span style="color:#ce4242;"> </span><span style="color:#c83e3e;"> </span><span style="color:#c23a3a;"> </span><span style="color:#bc3636;"> </span><span style="color:#b73333;"> </span><span style="color:#b12f2f;"> </span><span style="color:#ab2b2b;"> </span><span style="color:#a52727;"> </span><span style="color:#9f2424;"> </span><span style="color:#992121;"> </span><span style="color:#931e1e;"> </span><span style="color:#8c1b1b;"> </span><span style="color:#861818;"> </span><span style="color:#801515;"> </span><span style="color:#7a1212;"> </span><span style="color:#751010;"> </span><span style="color:#700d0d;"> </span><span style="color:#6b0b0b;"> </span><span style="color:#650909;">_</span><span style="color:#600707;">_</span><span style="color:#5b0404;"> </span><span style="color:#560202;"> </span><span style="color:#510202;"> </span><span style="color:#4c0101;"> </span><span style="color:#470101;"> </span><span style="color:#420101;"> </span><span style="color:#3d0101;"> </span><span style="color:#380000;"> </span><span style="color:#330000;"> </span></div><div><span style="color:#c83e3e;"> </span><span style="color:#c23a3a;"> </span><span style="color:#bc3636;"> </span><span style="color:#b73333;">_</span><span style="color:#b12f2f;">_</span><span style="color:#ab2b2b;">_</span><span style="color:#a52727;">_</span><span style="color:#9f2424;"> </span><span style="color:#992121;"> </span><span style="color:#931e1e;"> </span><span style="color:#8c1b1b;">_</span><span style="color:#861818;">_</span><span style="color:#801515;">_</span><span style="color:#7a1212;">_</span><span style="color:#751010;"> </span><span style="color:#700d0d;"> </span><span style="color:#6b0b0b;"> </span><span style="color:#650909;">/</span><span style="color:#600707;"> </span><span style="color:#5b0404;">/</span><span style="color:#560202;">_</span><span style="color:#510202;"> </span><span style="color:#4c0101;"> </span><span style="color:#470101;"> </span><span style="color:#420101;">_</span><span style="color:#3d0101;">_</span><span style="color:#380000;">_</span><span style="color:#330000;">_</span><span style="color:#4d0b0b;">_</span></div><div><span style="color:#c23a3a;"> </span><span style="color:#bc3636;"> </span><span style="color:#b73333;">/</span><span style="color:#b12f2f;"> </span><span style="color:#ab2b2b;">_</span><span style="color:#a52727;">_</span><span style="color:#9f2424;"> </span><span style="color:#992121;">\\</span><span style="color:#931e1e;"> </span><span style="color:#8c1b1b;">/</span><span style="color:#861818;"> </span><span style="color:#801515;">_</span><span style="color:#7a1212;">_</span><span style="color:#751010;"> </span><span style="color:#700d0d;">\\</span><span style="color:#6b0b0b;"> </span><span style="color:#650909;">/</span><span style="color:#600707;"> </span><span style="color:#5b0404;">_</span><span style="color:#560202;">_</span><span style="color:#510202;">/</span><span style="color:#4c0101;"> </span><span style="color:#470101;"> </span><span style="color:#420101;">/</span><span style="color:#3d0101;"> </span><span style="color:#380000;">_</span><span style="color:#330000;">_</span><span style="color:#4d0b0b;">_</span><span style="color:#671616;">/</span></div><div><span style="color:#bc3636;"> </span><span style="color:#b73333;">/</span><span style="color:#b12f2f;"> </span><span style="color:#ab2b2b;">/</span><span style="color:#a52727;"> </span><span style="color:#9f2424;">/</span><span style="color:#992121;"> </span><span style="color:#931e1e;">/</span><span style="color:#8c1b1b;">/</span><span style="color:#861818;"> </span><span style="color:#801515;">/</span><span style="color:#7a1212;">_</span><span style="color:#751010;">/</span><span style="color:#700d0d;"> </span><span style="color:#6b0b0b;">/</span><span style="color:#650909;">/</span><span style="color:#600707;"> </span><span style="color:#5b0404;">/</span><span style="color:#560202;">_</span><span style="color:#510202;"> </span><span style="color:#4c0101;"> </span><span style="color:#470101;"> </span><span style="color:#420101;">/</span><span style="color:#3d0101;"> </span><span style="color:#380000;">/</span><span style="color:#330000;"> </span><span style="color:#4d0b0b;"> </span><span style="color:#671616;"> </span><span style="color:#812121;"> </span></div><div><span style="color:#b73333;">/</span><span style="color:#b12f2f;">_</span><span style="color:#ab2b2b;">/</span><span style="color:#a52727;"> </span><span style="color:#9f2424;">/</span><span style="color:#992121;">_</span><span style="color:#931e1e;">/</span><span style="color:#8c1b1b;"> </span><span style="color:#861818;">\\</span><span style="color:#801515;">_</span><span style="color:#7a1212;">_</span><span style="color:#751010;">_</span><span style="color:#700d0d;">_</span><span style="color:#6b0b0b;">/</span><span style="color:#650909;"> </span><span style="color:#600707;">\\</span><span style="color:#5b0404;">_</span><span style="color:#560202;">_</span><span style="color:#510202;">/</span><span style="color:#4c0101;"> </span><span style="color:#470101;"> </span><span style="color:#420101;">/</span><span style="color:#3d0101;">_</span><span style="color:#380000;">/</span><span style="color:#380000;">  v' + this.VERSION + '</span></div></div>');

        $output_box.append($logo);
        $popup.append($output_box);
        $popup.append($command_marker);
        $popup.append($input_box);
        $popup.append($close);
        $('body').append($popup);

        this.show();
    }

    this.initialize = function() {
        if (!String.prototype.pad) {
            String.prototype.pad = function(pad_char, pad_length, pad_right) {
               var result = this;
               if( (typeof pad_char === 'string') && (pad_char.length === 1) && (pad_length > this.length) )
               {
                  var padding = new Array(pad_length - this.length + 1).join(pad_char); //thanks to http://stackoverflow.com/questions/202605/repeat-string-javascript/2433358#2433358
                  result = (pad_right ? result + padding : padding + result);
               }
               return result;
            }
        }

        // Add CSS for custom web fonts
        var $head = $("head");
        var $headlinklast = $head.find('link[rel="stylesheet"]:last');
        var linkElement = '<link href="//fonts.googleapis.com/css?family=Fredoka+One|Source+Code+Pro" rel="stylesheet" type="text/css"/>';
        if ($headlinklast.length) {
           $headlinklast.after(linkElement);
        }
        else {
           $head.append(linkElement);
        }

        var that = this;

        // Attach Keypress Listener
        $('body').on('keyup', function(evt) {
            if ((that.config['trigger_keycodes'] || [17, 91]).indexOf(evt.keyCode) !== -1) {
                if (localStorage.getItem('notr.keypress_timer')) {
                    that.toggle();
                    localStorage.removeItem('notr.keypress_timer');
                } else {
                    localStorage.setItem('notr.keypress_timer', '1');
                }
                window.setTimeout(function() {
                    localStorage.removeItem('notr.keypress_timer');
                }, that.config['keypress_timeout'] || 500);
            }
        });


        chrome.runtime.sendMessage({action: "notr.get_installation_id"}, function(response) {
          that.installation_id = response['notr.installation_id'];
        });

        this.register_builtins();
    }

    // Initialize the object before usage
    this.initialize();
};

var notr = new Notr();