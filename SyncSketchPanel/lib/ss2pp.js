


var framerate = 23.98

var markerColors = 
[
    {id: 0, name: "olive", color: "#718637"},
    {id: 1, name: "red", color: "#D22C36"},
    {id: 2, name: "pink", color: "#AF8BB1"},
    {id: 3, name: "orange", color: "#E96F24"},
    {id: 4, name: "ochre", color: "#D0A12B"},
    {id: 5, name: "white", color: "#FFF"},
    {id: 6, name: "blue", color: "#428DFC"},
    {id: 7, name: "cyan", color: "#19F4D6"},
]

function timecode_set_framerate(rate) {
    framerate = rate;
  }
  
function timecode_get_framerate() {
    return framerate;
  }
  
function timecode_to_frames(timecode) {
      var a = timecode.split(':');
      return ((Number(a[0])*3600 + Number(a[1])*60 + Number(a[2]))*framerate + Number(a[3]));
  }
  
  
function frames_to_timecode(frames) {
    return util.printf("%02d:%02d:%02d:%02d", 
      Math.floor(frames / (3600 * framerate)),
      Math.floor((frames / (60 * framerate)) % 60),
      Math.floor((frames / framerate) % 60),
      frames % framerate);
  }

  // Validates 23.98 but not 23.976
  // Doesn't like semicolons
  var isValidSMPTETimeCode = new RegExp(/(^(?:(?:[0-1][0-9]|[0-2][0-3]):)(?:[0-5][0-9]:){2}(?:[0-2][0-9])$)/);

function fetchProjects(ss) {
    var apiData = ss.apiParams;
    $('.projectPopup').remove();
    ss.getProjects( res => { buildPopup( res, 'project') } );
}

function fetchReviews(ss, projectId) {
    var apiData = ss.apiParams;
    $('.reviewPopup').remove();
    ss.getReviewsByProjectId(projectId, res => { buildPopup(res, 'review') } );
}

function fetchItems(ss, reviewId, callback) {
    var apiData = ss.apiParams;
    $('.itemPopup').remove();
    if( reviewId == undefined ) {
        ss.getMedia({}, res => { 
            buildPopup( res, "item" );
        });  
    } else {
        ss.getMediaByReviewId(reviewId, res => { buildPopup( res, "item" ) } );
    }
}

function buildPopup(res, type = "project'") {
    if(res.err === undefined) {
        var items = [];
        items.push( "<option value='*'>&lt;Any&gt;</option>");
        $.each( res.objects, function( key, val ) {
            items.push(`<option value='${val.id}' ${type == "item" ? "data-fps = '" + val.fps + "' ": " "} >${JSON.stringify(val.name)}</option>`);
        });
        $(`.${type}List`).append($( "<select/>", {
            "class": `${type}Popup`,
            html: items.join( "" )
        }))
    }
}

const demoMarkers = [
    {
        name: "Marker One",
        comment: "This is the comment",
        start: '' 
    }
]

function writeMarkers(sequenceId, markers = demoMarkers) {

    var activeSequence = app.project.activeSequence;
    if (activeSequence) {
        
    }

}