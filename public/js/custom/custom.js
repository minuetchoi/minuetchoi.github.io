$(document).ready(function(){

    var $video = $('video');

    if ($video.length > 0) {

        $.ajax({
            type: "GET",
            url: $video.data('json'),
            cache: false,
            datatype: "JSON",
            success: function (obj) {
               var player = videojs('player', {
                    autoplay: true,
                    loop: true,
                    muted: true,
                    preload: true,
                    controls: true
                });
                player.playlist(obj);
                player.playlist.autoadvance(0);
                player.playlist.repeat(true);
            },
            error: function (xhr, status, error) {
                console.log("ERROR!!!"); 
            }
        });
    }
});