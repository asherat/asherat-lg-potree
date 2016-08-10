

// Create SocketIO instance, connect
var CPManager = io.connect('/manager');

// Add a connect listener
CPManager.on('connect',function() {
	console.debug('Manager Module Loaded');
});

// Add a disconnect listener
CPManager.on('disconnect',function() {
	console.debug('Manager Module has disconnected!');
});

CPManager.on( 'CPDir', function( data ) {
	//console.debug("RECEIVED:", data);
	if (!data) return;
	data = data.sort();
	var content = $( "#cpFiles" ).html();
	for (i = 0; i < data.length; i++) { 
		var newMsgContent = 
		'<li>'+
			'<img class="gallery" src="../resources/pointclouds/' + data[i] + '/preview.png"' +
				'onerror="this.onerror=null;this.src=\'../resources/images/logo_black.png\';" ' +
				'onclick="sendMessageToServer(\'' + data[i] + '\')" />' +
			'<h3>'+ data[i] +'</h3>'+
			'<div class="buttons">'+
				'<img id="edit-pc" src="../resources/images/edit.png" onclick="editPC(\''+data[i]+'\')" />'+
				'<img id="delete-pc" src="../resources/images/delete.png" onclick="deletePC(\''+data[i]+'\')" />'+
			'</div>'+
		'</li>';

		content = content + newMsgContent; 

	}
	var lastContent = 
	'<li id="addbutton">'+
		'<img id="create-pc" src="../resources/images/add.png" />'+
	'</li>';
	content = content + lastContent;
	$( "#cpFiles" ).html( content );
});

CPManager.on( 'error', function( err ) {
	console.error("FOUND ERROR", err);
});


// Sends a message to the server via sockets
function sendMessageToServer(message) {
	CPManager.emit('changeData',message);
};


function RefreshBrowsers(){
	CPManager.emit('refresh');
}

$(document).ready(function() {
	
	CPManager.emit('getCPDirs');
	
	$("#addPC").on('change', '#img', function(){
		readURL("#preview", this);
	});


	$("#editPC").on('change', '#img2', function(){
		readURL("#preview2", this);
	});
	
});	


function deletePC(name){
	console.log("HOLA")
	$('#origName3')[0].value = name;
	var val = $(event.target).parent().siblings('.gallery');
	$('#preview3').attr('src', val.attr('src'));
}

function editPC(name){
	$('#origName')[0].value = name;
	$('#dirName2')[0].value = name;
	var val = $(event.target).parent().siblings('.gallery');
	$('#preview2').attr('src', val.attr('src'));
}

$( function() {
    var dialog, form, 
 
      dirRegex = /^[^\\/:*?<>|]+$/,
	  zipfile = $( "#zipfile" ),
      dirName = $( "#dirName" ),
      img = $( "#img" ),
      allFields = $( [] ).add( zipfile ).add( dirName ).add( img ),
      tips = $( ".validateTips" );
	  
 
    function updateTips( t ) {
      tips
        .text( t )
        .addClass( "ui-state-highlight" );
      setTimeout(function() {
        tips.removeClass( "ui-state-highlight", 1500 );
      }, 500 );
    }
 
    function checkLength( o, n, min, max ) {
      if ( o.val().length > max || o.val().length < min ) {
        o.addClass( "ui-state-error" );
        updateTips( "Length of " + n + " must be between " +
          min + " and " + max + "." );
        return false;
      } else {
        return true;
      }
    }
 
    function checkRegexp( o, regexp, n ) {
      if ( !( regexp.test( o.val() ) ) ) {
        o.addClass( "ui-state-error" );
        updateTips( n );
        return false;
      } else {
        return true;
      }
    }
	
	function checkExt(sName, sExt, n){
		if (sName != "" && sName.substr(sName.length - sExt.length, sExt.length).toLowerCase() == sExt.toLowerCase()) {
			return true;
		}else{
			updateTips( n );
			return false;
		}
	}
 
    function addPC() {
      var valid = true;
      allFields.removeClass( "ui-state-error" );
	  
	  valid = valid && checkExt( zipfile.val(), '.zip', "Data must be a .zip file" );
      valid = valid && checkLength( dirName, "Point Cloud Data", 3, 25 );
      valid = valid && checkRegexp( dirName, dirRegex, "Invaled name" );
	  valid = valid && checkExt( img.val(), '.png', "Image must be a .png file" );
	  

      if ( valid ) {
		console.log("Added Point Cloud Data", dirName.val());
		form[0].submit();
		$(this).find('#addPC')[0].reset();
		$("#preview").attr('src', "#");
		dialog.dialog( "close" );
		window.location.reload();
      }
      return valid;
    }
 
    dialog = $( "#dialog-form" ).dialog({
      autoOpen: false,
      height: 500,
      width: 440,
      modal: true,
	  closeOnEscape: false,
	  resizable: false,
      buttons: {
        "Add": addPC,
        Cancel: function() {
          dialog.dialog( "close" );
		   $(this).find('#addPC')[0].reset();
		   $("#preview").attr('src', "#");
        }
      },
      close: function() {
        form[ 0 ].reset();
        allFields.removeClass( "ui-state-error" );
      }
    });
	
	
    form = dialog.find( "form#addPC" ).on( "submit", function( event ) {
      event.preventDefault();
      addPC();
    });
 
    $( document.body ).on( "click", '#create-pc', function() {
      dialog.dialog( "open" );
    });
	
	
	
	var dialog2, form2,
	  origName = $( "#origName" ),
	  dirName2 = $( "#dirName2" ),
      img2 = $( "#img2" ),
      allFields2 = $( [] ).add(origName).add( dirName2 ).add( img2 );
	
    function editPC() {
      var valid = true;
      allFields2.removeClass( "ui-state-error" );

      valid = valid && checkLength( dirName2, "Point Cloud Data", 3, 25 );
      valid = valid && checkRegexp( dirName2, dirRegex, "Invalid name" );
	  valid = valid && (img2.val() == "" || checkExt( img2.val(), '.png', "Image must be a .png file" ));
	  

      if ( valid ) {
		console.log("Edited Point Cloud Data", dirName2.val());
		form2[0].submit();
		$(this).find('#editPC')[0].reset();
		$('#preview2').attr('src', '#');
		dialog2.dialog( "close" );
		window.location.reload();
      }
      return valid;
    }
 
    dialog2 = $( "#dialog-form2" ).dialog({
      autoOpen: false,
      height: 440,
      width: 440,
      modal: true,
	  closeOnEscape: false,
	  resizable: false,
      buttons: {
        "Edit": editPC,
        Cancel: function() {
          dialog2.dialog( "close" );
		  $(this).find('#editPC')[0].reset();
		  $('#preview2').attr('src', '#');
        }
      },
      close: function() {
        form2[ 0 ].reset();
        allFields2.removeClass( "ui-state-error" );
      }
    });
	
	form2 = $( "form#editPC" ).on( "submit", function(  ) {
		event.preventDefault();
		editPC();
    });
 
    $( document.body ).on( "click", '#edit-pc', function() {
      dialog2.dialog( "open" );
    });
	
	
	
	var dialog3, form3,
	  origName3 = $( "#origName3" );

    function deletePC() {
 
		console.log("Deleted Point Cloud Data", origName3.val());
		form3[0].submit();
		dialog3.dialog( "close" );
		window.location.reload();
      
      return true;
    }
 
    dialog3 = $( "#dialog-form3" ).dialog({
      autoOpen: false,
      height: 360,
      width: 300,
      modal: true,
	  closeOnEscape: false,
	  resizable: false,
      buttons: {
        "Delete": deletePC,
        Cancel: function() {
          dialog3.dialog( "close" );
        }
      },
    });
	
	form3 = $( "form#deletePC" ).on( "submit", function(  ) {
		event.preventDefault();
		deletePC();
    });
 
    $( document.body ).on( "click", '#delete-pc', function() {
      dialog3.dialog( "open" );
    });
	
	
	
  } );


  function readURL(elem, input) {

    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $(elem).attr('src', e.target.result);
        }

        reader.readAsDataURL(input.files[0]);
    }
}


