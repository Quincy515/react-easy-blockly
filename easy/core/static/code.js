var Code = Code || {};
Code.Toolbox = Code.Toolbox || {};
Code.Auth = Code.Auth || {};
var Blockly = Blockly || {};
Blockly.Xml = Blockly.Xml || {};
var code;
var processor = false;
var sketchFrame = document.getElementById('sketchFrame');
// Code.Toolbox.createToolbox();
Code.workspace = Blockly.inject(document.getElementById('blocklyDiv'), {
    media: 'media/',
    toolbox: document.getElementById('toolbox'),
    zoom: {
        controls: true,
        // wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2
    },
    trashcan: true
    // toolbox: Code.Toolbox.adv
});
// hide "switch to advanced toolbox" because that's where we'll start
$('#advancedToolbox').addClass('hidden');

Code.getBBox_ = function(element) {
    var height = element.offsetHeight;
    var width = element.offsetWidth;
    var x = 0;
    var y = 0;
    do {
        x += element.offsetLeft;
        y += element.offsetTop;
        element = element.offsetParent;
    } while (element);
    return {
        height: height,
        width: width,
        x: x,
        y: y
    };
};
var container = document.getElementById('main');
var bBox = Code.getBBox_(container);
var el = document.getElementById('blocklyDiv');

el.style.top = bBox.y + 'px';
el.style.left = bBox.x + 'px';
// Height and width need to be set, read back, then set again to
// compensate for scrollbars.
el.style.height = bBox.height - 88 + 'px';
el.style.width = bBox.width + 'px';
$(".resizableDiv").resizable({
    handles: "s,w,sw",
    /*resize: function(event, ui) {
     // position the div using left and top (that's all I get!)
     if ($( '#main' ).width() - ui.size.width < 20)
     ui.size.width = $( '#main' ).width() - 20;
     if ($( '#main' ).height() - ui.size.height < 70)
     ui.size.height = $( '#main' ).height() - 70;

     ui.position.left = $( window ).width() - (ui.size.width + 12);
     ui.position.top = 55;
     }*/
    alsoResize: '#sketchFrame'
});

Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'), Code.workspace);
Blockly.svgResize(Code.workspace);
function executeBlockCode() {
    sketchFrame.onload = function () {
        code = Blockly.JavaScript.workspaceToCode(Code.workspace);
        code += '\n  function windowResized() {\n' +
            'resizeCanvas(windowWidth, windowHeight);\n'+
            '}';
//                var s = new Function("yak", code);
//                Pjs = new p5(s);
        code += '\n new p5();\n';

        var userScript = sketchFrame.contentWindow.document.createElement('script');
        userScript.type = 'text/javascript';
        userScript.text = code;
        userScript.async = false;
        sketchFrame.contentWindow.document.body.appendChild(userScript);
    };
    $('#sketchFrame').attr('src', $('#sketchFrame').attr('src'));
    setupGIF();
}
document.getElementById('playButton').addEventListener('click', executeBlockCode);

$('#displayCode').click(function () {
    var content = document.getElementById('openYaKCode');
    code = Blockly.JavaScript.workspaceToCode(Code.workspace);
    content.textContent = code;
    Blockly.svgResize(Code.workspace);
});
/**
 * Bind a function to a button's click event.
 * On touch enabled browsers, ontouchend is treated as equivalent to onclick.
 * @param {!Element|string} el Button element or ID thereof.
 * @param {!Function} func Event handler to bind.
 */
Code.bindClick = function(el, func) {
    if (typeof el == 'string') {
        el = document.getElementById(el);
    }
    el.addEventListener('click', func, true);
    el.addEventListener('touchend', func, true);
};

/**
 * Discard all blocks from the workspace.
 */
Code.discard = function() {
    var count = Code.workspace.getAllBlocks().length;
    if (count < 2 ||
        window.confirm(Blockly.Msg.DELETE_ALL_BLOCKS.replace('%1', count))) {
        Code.workspace.clear();
        if (window.location.hash) {
            window.location.hash = '';
        }
    }
};
// undo/redo buttons should undo/redo changes
Code.bindClick('undoButton',
    function() {
        Code.workspace.undo(false)
    });
Code.bindClick('redoButton',
    function() {
        Code.workspace.undo(true)
    });
Code.bindClick('trashButton', function() {Code.discard();});

/**
 * used for determining when to prompt the user to save.
  */
// do we need to prompt the user to save? to start out, no.
Code.needToSave = 0;

Code.setSaveNeeded = function(saveNeeded) {
    if (saveNeeded) {
        Code.needToSave = 1;
        // console.log("setting needToSave to 1");
    }
    else {
        Code.needToSave = 0;
        // console.log("setting needToSave to 0");
    }
};
/**
 * Save the workspace to an XML file.
 */
Code.saveBlocksLocal = function() {
    var xmlDom = Blockly.Xml.workspaceToDom(Blockly.getMainWorkspace());
    var xmlText = Blockly.Xml.domToText(xmlDom);
    console.log(xmlText);
    var blob = new Blob([xmlText], {type: "text/plain;charset=utf-8"});


    // pull a filename entered by the user
    var blocks_filename = $('#project-name').val();
    // don't save without a filename.  Name isn't checked for quality.
    // console.log("in SaveBlocksLocal with: ", blocks_filename);
    if (blocks_filename) {
        saveAs(blob, blocks_filename + ".xml");
        // console.log("SAVED locally: setting needToSave to 0");
        Code.setSaveNeeded();
    }
    else {
        alert( 'SAVE_FAILED!\n');
    }
};

/**
 * Save the  code for the current workspace to the local machine.
 */
Code.saveOpenscadLocal = function() {
    var code = Blockly.JavaScript.workspaceToCode(Code.workspace);
    var blob = new Blob([code], {type: "text/plain;charset=utf-8"});

    // pull a filename entered by the user
    var blocks_filename = $('#project-name').val();
    // don't save without a filename.  Name isn't checked for quality.
    if (blocks_filename) {
        saveAs(blob, blocks_filename + ".yak");
    }
    else {
        alert("SAVE FAILED.  Please give your project a name, then try again.");
    }
};
Code.loadLocalBlocks = function(e) {
    var evt = e;
    if (evt.target.files.length) {
        if (Code.needToSave) {
            promptForSave().then(function(wantToSave) {
                if (wantToSave=="cancel") {
                    return;
                }
                if (wantToSave=="nosave")
                    Code.setSaveNeeded();
                else if (wantToSave=="save")
                    Code.saveBlocks();

                // console.log("time to load the local blocks!");
                Code.createNewProject();
                readSingleFile(evt,true);

            }).catch(function(result) {
                console.log("caught an error in new project.  result is:" + result);

            });
        }
        else {
            // console.log("no need to save old project.  Just load the new blocks.");
            Code.createNewProject();
            readSingleFile(evt,true);
        }
    }
};
/**
 * FileSaver.js stuff
 * Loading a blocks xml file
 * if replaceOld is true, any current blocks are ditched, a new project is started
 * and the filename loaded is used as the project filename.
 * if replaceOld is false, the blocks are inserted in the current project,
 * adding to the blocks that are there already and not changing the filename.
 */


function readSingleFile(evt, replaceOld) {

    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0];
    //console.log("in readSingleFile.  f is ", f);

    if (f) {
        var proj_name;

        if (replaceOld) {
            // use the name of the loaded file to fill the "file loading" and "project name" boxes.
            proj_name = f.name.substr(0,f.name.lastIndexOf('(')) || f.name;
            proj_name = proj_name.substr(0,f.name.lastIndexOf('.')) || proj_name;

            // trim any whitespace from the beginning or end of the project name
            proj_name = proj_name.replace(/^\s+|\s+$/g,'');
        }

        if (replaceOld) {
            // first, autosave anything new.  Is there anything on the undo stack?  If so, save the changes.
            // if (Blockscad.needToSave) {
            //   // Blockscad.Auth.saveBlocksToAccount();
            // }
            // if we had a current project before, we just changed to something else!
            Code.Auth.currentProject = '';
            // clear the workspace to fit the new file contents.

        }

        if (replaceOld)
            Blockly.getMainWorkspace().clear();

        var contents = {};
        var stuff = {};
        var r = new FileReader();
        // all the file processing has to go inside the onload function. -JY
        r.onload = function(e) {

            contents = e.target.result;
            var xml = Blockly.Xml.textToDom(contents);
            Blockly.Xml.domToWorkspace(xml, Code.workspace);
            Blockly.svgResize(Code.workspace);

            // Code.clearStlBlocks();
        };
        r.readAsText(f);

        // in order that we can read this filename again, I'll clear out the current filename
        $("#importLocal")[0].value = '';
        $("#loadLocal")[0].value = '';

        if (replaceOld)
            $('#project-name').val(proj_name);

        // I should hide the projectView
        // , and show the editView.
        $('#projectView').addClass('hidden');
        $('#editView').removeClass('hidden');
        // turn the big save button back on.

        if (!Code.offline) $('#bigsavebutton').removeClass('hidden');

        // switch us back to the blocks tab in case we were on the code tabe.
        $('#displayBlocks').click();
        // trigger a resize so that I make sure the window redraws.
        window.dispatchEvent(new Event('resize'));

        // clear the render window
        // Blockscad.gProcessor.clearViewer();

    } else {
        // alert("Failed to load file");
    }
}
/**
 * Start a new project (save old project to account if logged in, clear blocks, clear rendered view)
  */
// if true, won't attempt to contact the YaK cloud backend.
Code.offline = true;

Code.newProject = function() {
    // if the user was on the code tab, switch them to the blocks tab.
    $('#displayBlocks').click();
    // should I prompt a save here?  If I have a current project, I should just save it?  Or not?
    // if the user is logged in, I should auto-save to the backend.
    // console.log("in YaK.newProject");
    // console.log("needToSave is: ", YaK.needToSave);
    if (Code.needToSave) {
        promptForSave().then(function(wantToSave) {
            if (wantToSave=="cancel") {
                return;
            }
            if (wantToSave=="nosave")
                Code.setSaveNeeded();
            else if (wantToSave=="save")
                Code.saveBlocks();

            // console.log("time to get a new project!");
            Code.createNewProject();

        }).catch(function(result) {
            console.log("caught an error in new project.  result is:" + result);

        });
    }
    else {
        // console.log("no need to save old project.  Just make a new one..");
        Code.createNewProject();
    }
};
Code.createNewProject = function() {
    Code.clearProject();
    // YaK.workspaceChanged();
    Code.workspace.clearUndo();
    // disable undo buttons
    // $('#undoButton').prop('disabled', true);
    // $('#redoButton').prop('disabled', true);  
    setTimeout(Code.setSaveNeeded, 300);
    $('#displayBlocks').click();
    if (!Code.offline)
        $('#bigsavebutton').removeClass('hidden');
};
Code.clearProject = function() {

    if (!Code.offline) {
        // now I should make the new project.
        Code.Auth.currentProject = '';
        Code.Auth.currentProjectKey = '';
    }
    Code.workspace.clear();

    $('#project-name').val('Untitled');
    $('#projectView').addClass('hidden');
    $('#editView').removeClass('hidden');
    // turn the big save button back on.
    $('#bigsavebutton').removeClass('hidden');
    // trigger a resize so that I make sure the window redraws.
    window.dispatchEvent(new Event('resize'));
};

// first attempt to use promises for async stuff!
function promptForSave() {
    // console.log("in promptForSave()");
    var message = '<h4>' + YaK.Msg.SAVE_PROMPT + '</h4>';
    return new Promise(function(resolve, reject) {
        bootbox.dialog({
            message: message,
            backdrop: true,
            size: "small",
            buttons: {
                save: {
                    label: YaK.Msg.SAVE_PROMPT_YES,
                    className: "btn-default btn-lg primary pull-right giant-yes",
                    callback: function(result) {
                        // console.log("save clicked.  Result was: ", result);
                        resolve("save");
                    }
                },
                dont_save: {
                    label: YaK.Msg.SAVE_PROMPT_NO,
                    className: "btn-default btn-lg primary pull-left giant-yes",
                    callback: function(result) {
                        // console.log("don't save clicked.  Result was: ", result);
                        resolve("nosave");
                    }
                }
            },
            onEscape: function() {
                // console.log("bootbox dialog escaped.");
                resolve("cancel");
            }
        });
    });
}
Code.saveBlocks = function() {
    // save to cloud storage if available and logged in
    if (!YaK.offline && YaK.Auth.isLoggedIn) {
        YaK.Auth.saveBlocksToAccount();
    }
    else {
        // i'm not logged into an account.  Save blocks locally.
        YaK.saveBlocksLocal();
    }
};
// set up handler for saving blocks locally
$('#file-menu').on('click', '#saveLocal', Code.saveBlocksLocal);

// set up handler for exporting openscad code locally
$('#file-menu').on('click', '#saveOpenscad', Code.saveOpenscadLocal);

// handle the project->new menu option
$('#main').on('click', '.new-project', Code.newProject);

// handle the project->load (blocks, stl, import blocks)  options
$('#file-menu').on('change', '#loadLocal', function(e) { Code.loadLocalBlocks(e);});
$('#file-menu').on('change', '#importLocal', function(e) { readSingleFile(e, false);});

// toolbox toggle handlers
// $('#simpleToolbox').on('click', function() {
//     // console.log("switching to simple toolbox");
//     $('#simpleToolbox').addClass('hidden');
//     $('#advancedToolbox').removeClass('hidden');
//     if (Code.workspace) {
//         Code.Toolbox.catIDs = [];
//         Code.workspace.updateToolbox(Code.Toolbox.sim);
//     }
// });
// $('#advancedToolbox').on('click', function() {
//     // console.log("switching to advanced toolbox");
//     $('#advancedToolbox').addClass('hidden');
//     $('#simpleToolbox').removeClass('hidden');
//     if (Code.workspace) {
//         Code.Toolbox.catIDs = [];
//         Code.workspace.updateToolbox(Code.Toolbox.adv);
//     }
// });

/**
 * example handlers
 * to add an example, add a list item in index.html, add a click handler below, 
 * and be sure to put the name of the example file in the msg field.  The xml
 * file should be saved in the "examples" folder.
 */

Code.showExample = function(e) {
    var example = "examples/" + e.data.msg;
    var name = e.data.msg.split('.')[0];

    // console.log("in showExample");
    if (Code.needToSave) {
        promptForSave().then(function(wantToSave) {
            if (wantToSave=="cancel") {
                return;
            }
            if (wantToSave=="nosave")
                Code.setSaveNeeded();
            else if (wantToSave=="save")
                Code.saveBlocks();

            // console.log("i would try to show the example now!");
            Code.getExample(example, name);
        }).catch(function(result) {
            console.log("caught an error in show example 1.  result is:" + result);

        });
    }
    else {
        // console.log("no need to save old project.  Just go get example.");
        Code.getExample(example, name);
    }
};

Code.getExample = function(example, name) {
    $.get(example, function( data ) {

        Code.clearProject();
        // Blockscad.workspaceChanged();
        // turn xml data object into a string that Blockly can use
        var xmlString;
        //IE
        if (window.ActiveXObject){
            xmlString = data.xml;
        }
        // code for Mozilla, Firefox, Opera, etc.
        else{
            xmlString = (new XMLSerializer()).serializeToString(data);
        }
        // console.log(xmlString);
        // load xml blocks
        var xml = Blockly.Xml.textToDom(xmlString);
        Blockly.Xml.domToWorkspace(xml, Code.workspace);
        Blockly.svgResize(Code.workspace);
        // update project name
        $('#project-name').val(name + ' example');
        // we just got a new project.  It doesn't need saving yet.
        setTimeout(Code.setSaveNeeded, 300);
    });
}

$("#examples_box").click({ msg: 'box.xml'}, Code.showExample);
$("#examples_calculus").click({ msg: 'calculus.xml'}, Code.showExample);
$("#examples_heart").on("click",{ msg: 'heart.xml'}, Code.showExample);
$("#examples_flower").on("click",{ msg: 'flower.xml'}, Code.showExample);
$("#examples_tree").on("click",{ msg: 'tree.xml'}, Code.showExample);
$("#examples_simpleTree").on("click",{ msg: 'simpleTree.xml'}, Code.showExample);
$("#examples_sin1").on("click",{ msg: 'sincos.xml'}, Code.showExample);
$("#examples_sin2").on("click",{ msg: 'sincos2.xml'}, Code.showExample);
$("#examples_sin3").on("click",{ msg: 'sincos3.xml'}, Code.showExample);
$("#examples_DNA").on("click",{ msg: 'DNA.xml'}, Code.showExample);
$("#examples_particleFlow").on("click",{ msg: 'particleFlow.xml'}, Code.showExample);
$("#examples_treeFlower2").on("click",{ msg: 'treeFlower2.xml'}, Code.showExample);
$("#examples_treeFlower").on("click",{ msg: 'treeFlower.xml'}, Code.showExample);
$("#examples_1-1").on("click",{ msg: '1-1.xml'}, Code.showExample);
$("#examples_1-2").on("click",{ msg: '1-2.xml'}, Code.showExample);
$("#examples_1-2-2").on("click",{ msg: '1-2-2.xml'}, Code.showExample);
$("#examples_1-3").on("click",{ msg: '1-3.xml'}, Code.showExample);
$("#examples_1-4").on("click",{ msg: '1-4.xml'}, Code.showExample);
$("#examples_1-5").on("click",{ msg: '1-5.xml'}, Code.showExample);
$("#examples_1-6").on("click",{ msg: '1-6.xml'}, Code.showExample);
$("#examples_1-7").on("click",{ msg: '1-7.xml'}, Code.showExample);
$("#examples_2-1").on("click",{ msg: '2-1.xml'}, Code.showExample);
$("#examples_2-2").on("click",{ msg: '2-2.xml'}, Code.showExample);
/**
 *  SIDE CONTROLS
 *  heart comment fork share camera gif
 *
 */
$( "#dialog" ).dialog({
    autoOpen: false
});

$( "#gifButton" ).on( "click", function() {
    $( "#dialog" ).dialog( "open" );
    // console.log("dialog open");
});


/**
 *  GIF
 *
 */
var setupRecordMode = function(){
    $('body').addClass('recordMode');
    $('#recordButton').off('click').on('click',recordGIF);
    // $('#playButton ').click();

    //set 'r' key
    Mousetrap(window).bind('r', function (e) {
        //e.preventDefault();
        recordGIF();
        return true;
    });
    Mousetrap($('#renderDiv iframe').get(0).contentWindow).bind('r', function (e) {
        //e.preventDefault();
        recordGIF();
        return true;
    });
    Mousetrap(window).bind('escape', function (e) {
        e.preventDefault();
        stopRecordingGIF();
        return false;
    });

    return false;

}
var setupGIF = function(){
    $('#recordGifLink').on('click',setupRecordMode);
    // console.log("function:setupGIF id:recordGifLink Click to Record")

}
var recordGIF = function () {
    $('#recordButton').addClass('icon_recording pulsateInfinite');
    $('#recordContainer').addClass('recording');
    $('#animatedGIF, #animatedGIFLink').addClass('hide');
    let progressBar = $('<div id="recordGIFProgressBar"></div>');
    $('#renderDiv').append(progressBar);

    // window.processor.canvas 这个有问题
    window.processor.canvas = $($('#renderDiv iframe').get(0).contentWindow.document).find('canvas').get(0);

    // console.log("window.processor.canvas:", window.processor.canvas);

    var duration = 3000; //in ms
    var fps = 15;
    //let w = 400; //max width. Height will be scaled per w.
    //let h = w/$(processor.canvas).width()*$(processor.canvas).height();

    progressBar
        .css('transition','width ' + duration + 'ms linear')
    //.css('width','100%');

    //gifjs doesn't scale, it just crops, so stick to standard for now.
    // let w = $(window.processor.canvas).width();
    // let h = $(window.processor.canvas).height();

    let w = $($($('#renderDiv iframe').get(0).contentWindow.document).find('canvas').get(0)).width()
    let h = $($($('#renderDiv iframe').get(0).contentWindow.document).find('canvas').get(0)).height()

    // console.log("let w:", w);
    // console.log("let h:", h);

    window.gif = new GIF({
        workers: 4,
        quality: 7,
        repeat: 0,
        debug: false,
        width: w,
        height: h,
        workerScript: '/yakart/ide/gif/js/gif.worker.js'
    });

    //set frame creation timer
    let framer = window.setInterval(function () {
        window.gif.addFrame($($('#renderDiv iframe').get(0).contentWindow.document).find('canvas').get(0), {
            delay: 1000 / fps,
            copy: true
        });
    }, 1000 / fps);

    window.setTimeout(function () {
        clearInterval(framer);
        stopRecordingGIF();
        progressBar.remove();
        $('#recordGifLink').button('loading');
        $('#GIFProgress').show();

        //ga Google Analyse 没有使用
        // ga('send', {
        //     hitType: 'event',
        //     eventCategory: 'sketch',
        //     eventAction: 'createGIF'
        // });
        window.gif.on('progress', function(p) {
            return $('#GIFProgress').css('width', Math.round(p * 100) + "%");
        });
        window.gif.on('finished', function (blob) {
            let src = URL.createObjectURL(blob);
            //setupEditSketchPanel();
            updateGIF(src);
            $('#recordGifLink').button('reset');
            // $('#GIFProgress').hide();

        });
        window.gif.render();
    }, duration);

    //unset 'r' key
    Mousetrap.unbind('r');

    progressBar.css('width','100%');


}
var stopRecordingGIF = function(){
    $('body').removeClass('recordMode');
    $('#recordButton').removeClass('icon_recording pulsateInfinite');
    $('#recordContainer').removeClass('recording');

}
var updateGIF = function (imgURL) {
    $('#animatedGIF').css('background-image', 'url(' + imgURL + ')')
        .off('click').on('click', function(){
        window.open(imgURL);
    })
        .removeClass('hide');
    $('#animatedGIFLink').attr('href',imgURL).removeClass('hide');
}

var activatePanel = function (icon) {

    // $('#mainControls .icon').removeClass('selected');
    // $('#editSketchButton').removeClass('selected');
    $(icon).addClass('selected');

    var target = $(icon).attr('data-target');
    //show panel
    $('.panel, #sketch').removeClass('active').addClass('inactive');
    $(target).removeClass('inactive').addClass('active');
}
var toggleSidePanel = function (container) {
    //unselect others
    $('#sideControls .metric').not(container).parent().removeClass('selected');

    //toggle select for the current one
    $(container).parent().toggleClass('selected');


    //show panel
    var target = $(container).attr('data-target');
    $('.sidePanel').not(target).removeClass('active').addClass('inactive');
    $(target).toggleClass('active').toggleClass('inactive');

    //setup navbar hide behavior on select/unselect
    if ($('.metricGroup.selected').length > 0) {
        $('.navbar').removeClass('fade2Sketch');
        $('.navbar').addClass('opaque');
    } else if ($('#mainControls .icon_play').hasClass('selected')) {
        $('.navbar').addClass('fade2Sketch');
        $('.navbar').removeClass('opaque');
    }
}
//SIDE CONTROLS
$('#sideControls .metric').on('click', function () {
    toggleSidePanel(this);
    if ($(this).attr('data-target') == "#forkSidePanel") {
        //ajax load forks data;
        loadForks();
    }
    if ($(this).attr('data-target') == "#heartSidePanel") {
        //ajax load forks data;
        OP.setupImageLoading('#heartSidePanel .userThumb');
    }
})