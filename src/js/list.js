(function () {
    'use strict';

    var A = Chapel.Audio;
    var Track = A.classes.Track;
    var _extend = A.data._extend;
    
    function Playlist (id, trackIDs) {
        if (!(this instanceof Playlist)) {
            return new Playlist(id, trackIDs);
        }
        this.id = id;
        this.tracks = trackIDs.map( function (id) {
            return Track.get(id);
        });
        this.looping = false;
        this.current = '';
        this.playing = false;
    }

    Object.assign(Playlist, {
        list : {},

        is : function (inst) {
            return inst instanceof Playlist;
        },

        add : function (id, trackList, test) {
            if (test) {
                trackList = [].slice.call(arguments).slice(1);
            }
            Playlist.list[id] = new Playlist(id, trackList);
            return Playlist.list[id];
        }
    });

    Object.assign(Playlist.prototype, {
        constructor : Playlist,
        clone : function () { 
            return new Playlist(this.id, this.tracks.map( function (tr) { return tr.id; }));
        },
        shuffle : function () {
            var a = this.tracks;
            var j, x, i;
            for (i = a.length - 1; i > 0; i--) {
                j = Math.floor(Math.random() * (i + 1));
                x = a[i];
                a[i] = a[j];
                a[j] = x;
            }
            this.tracks = a;
            return this;
        },
        random : function () {
            return this.tracks[Math.floor(Math.random() * this.tracks.length)];
        },
        isPlaying : function () {
            return this.playing;
        },
        play : function (i) {
            var self = this;
            i = i || (function () {
                if (self.current) {
                    return self.tracks.findIndex( function (tr) {
                        return tr.id === self.current;
                    });
                } else {
                    return 0;
                }
            }());

            if (i >= self.tracks.length && self.looping) {
                i = 0;
            } else if (i >= self.tracks.length) {
                self.current = '';
                self.playing = false;
                return;
            }

            var track = self.tracks[i];
            var cached = track.isLooping();
            track.loop(false);

            track.play();
            self.playing = true;
            setTimeout( function () {
                if (!track.isPlaying()) {
                    self.playing = false;
                }
            }, 20);
            self.current = track.id;

            track.$el.one('ended.playlist', function () {
                i++;
                track.loop(cached);
                self.play(i);
            });

            return self;
        },
        loop : function (bool) {
            this.looping = !!bool;
            return this;
        },
        isLooping : function () {
            return this.looping;
        },
        stop : function () {
            var track = Track.get(this.current);
            track.stop();
            track.$el.off('.playlist');
            this.current = '';
            this.playing = false;
            return this;
        },
        pause : function () {
            Track.get(this.current).pause();
            this.playing = false;
            return this;
        }
    });

    // A.playlist('myplaylist').play(); or A.playlist('myplaylist').loop(true);

    A.classes.Playlist = Playlist;
    A.createPlaylist = function () {
        try {
            Playlist.add.apply(null, arguments);
        } catch (err) {
            console.error(err.message);
            alert('Error in A.createPlaylist() -> see the console for more information.');
        }
    };
    A.playlist = function (id) {
        try {
            var list = Playlist.list[id] || null;
            if (!list) {
                throw new Error('Playlist "' + id + '" does not exist.');
            }
            return list;
        } catch (err) {
            console.error(err.message);
            alert('Error in A.createPlaylist() -> see the console for more information.');
        }
    };
}());