


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

async function fetchProjects(ss) {
    $('.projectPopup').remove();
    let accts = await ss.getAccounts( true, 'id')
    let res = await ss.getProjects( accts[0] ); 
    buildPopup( res, 'project' );
}

async function fetchAccountId(ss) {
    return await ss.getAccounts( true, 'id');
}

async function fetchReviews(ss, projectId) {
    $('.reviewPopup').remove();
    let res = await ss.getReviewsByProjectId(projectId, true, 'id,name');
    buildPopup(res, 'review');
}

async function fetchItemRevisions(ss, itemId) {
    $('.revisionsPopup').remove();
    let res = await ss.getRevisions(itemId);
    buildPopup(res, 'item-revisions');
}

async function fetchItems(ss, reviewId) {
    console.log(`ReviewID is ${reviewId || 'undefined'}`)
    $('.itemPopup').remove();
    if( reviewId == undefined ) {
        let res = await ss.getMedia(); 
        buildPopup( res, "item" );
    } else {
        let res = await ss.getMediaByReviewId(reviewId);
        buildPopup( res, "item" );
    }
}

function buildPopup(res, type = "project'") {
    if(res.err === undefined) {
        var items = [];
        items.push( "<option value='*'>&lt;Any&gt;</option>");
        console.log(`Reviews in Project: ${JSON.stringify(res)}`)
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

function writeMarkers(app, sequenceId, markers = demoMarkers) {

    var activeSequence = app.project.activeSequence;
    if (activeSequence) {
        
    }

}