$(document).ready(function () {
    prepareAppBucketTree();
    $('#refreshBuckets').click(function () {
      $('#appBuckets').jstree(true).refresh();
    });
  
    $('#createNewBucket').click(function () {
      createNewBucket();
    });
  
    $('#createBucketModal').on('shown.bs.modal', function () {
      $("#newBucketKey").focus();
    })
  });
  
  function createNewBucket() {
    var bucketKey = $('#newBucketKey').val();
    var policyKey = $('#newBucketPolicyKey').val();
    jQuery.post({
      url: '/api/forge/oss/buckets',
      contentType: 'application/json',
      data: JSON.stringify({ 'bucketKey': bucketKey, 'policyKey': policyKey }),
      success: function (res) {
        $('#appBuckets').jstree(true).refresh();
        $('#createBucketModal').modal('toggle');
      },
      error: function (err) {
        if (err.status == 409)
          alert('Bucket already exists - 409: Duplicated')
        console.log(err);
      }
    });
  }
  
  function prepareAppBucketTree() {
    $('#appBuckets').jstree({
      'core': {
        'themes': { "icons": true },
        'data': {
          "url": '/api/forge/oss/buckets',
          "dataType": "json",
          'multiple': false,
          "data": function (node) {
            return { "id": node.id };
          }
        }
      },
      'types': {
        'default': {
          'icon': 'glyphicon glyphicon-question-sign'
        },
        '#': {
          'icon': 'glyphicon glyphicon-cloud'
        },
        'bucket': {
          'icon': 'glyphicon glyphicon-folder-open'
        },
        'object': {
          'icon': 'glyphicon glyphicon-file'
        }
      },
      "plugins": ["types", "state", "sort", "contextmenu"],
      contextmenu: { items: autodeskCustomMenu }
    }).on('loaded.jstree', function () {
      $('#appBuckets').jstree('open_all');
    }).bind("activate_node.jstree", function (evt, data) {
      if (data != null && data.node != null && data.node.type == 'object') {
        $("#forgeViewer").empty();
        var urn = data.node.id;
        getForgeToken(function (access_token) {
          jQuery.ajax({
            url: 'https://developer.api.autodesk.com/modelderivative/v2/designdata/' + urn + '/manifest',
            headers: { 'Authorization': 'Bearer ' + access_token },
            success: function (res) {
              if (res.status === 'success') launchViewer(urn);
              else $("#forgeViewer").html('The translation job still running: ' + res.progress + '. Please try again in a moment.');
            },
            error: function (err) {
              var msgButton = 'This file is not translated yet! ' +
                '<button class="btn btn-xs btn-info" onclick="translateObject()"><span class="glyphicon glyphicon-eye-open"></span> ' +
                'Start translation</button>'
              $("#forgeViewer").html(msgButton);
            }
          });
        })
      }
    });
  }
  
  function autodeskCustomMenu(autodeskNode) {
    var items;
  
    switch (autodeskNode.type) {
      case "bucket":
        items = {
          uploadFile: {
            label: "Upload file",
            action: function () {
              var treeNode = $('#appBuckets').jstree(true).get_selected(true)[0];
              uploadFile(treeNode);
            },
            icon: 'glyphicon glyphicon-cloud-upload'
          },
          bucketDelete: {
            "label": "Delete bucket",
            "action": function (obj) {
                deleteBucket(MyVars.selectedNode.id)
            }
          }
        };
        break;
      case "object":
        items = {
          translateFile: {
            label: "Translate",
            action: function () {
              var treeNode = $('#appBuckets').jstree(true).get_selected(true)[0];
              translateObject(treeNode.data.id);
            },
            icon: 'glyphicon glyphicon-eye-open'
          },
          fileDelete: {
            "label": "Delete file",
            "action": function (obj) {
                deleteFile(MyVars.selectedNode.id)
            }
          }
        };
        break;
    }
  
    return items;
  }
  
  function deleteFile(id) {

    console.log("Delete file = " + id);
    $.ajax({
        url: '/dm/files/' + encodeURIComponent(id),
        type: 'DELETE'
    }).done(function (data) {
        console.log(data);
        if (data.status === 'success') {
            $('#forgeFiles').jstree(true).refresh()
            showProgress("File deleted", "success")
        }
    }).fail(function(err) {
        console.log('DELETE /dm/files/ call failed\n' + err.statusText);
    });
}

function deleteBucket(id) {
    console.log("Delete bucket = " + id);
    $.ajax({
        url: '/dm/buckets/' + encodeURIComponent(id),
        type: 'DELETE'
    }).done(function (data) {
        console.log(data);
        if (data.status === 'success') {
            $('#forgeFiles').jstree(true).refresh()
            showProgress("Bucket deleted", "success")
        }
    }).fail(function(err) {
        console.log('DELETE /dm/buckets/ call failed\n' + err.statusText);
    });
}

  function uploadFile(node) {
    $('#hiddenUploadField').click();
    $('#hiddenUploadField').change(function () {
      if (this.files.length == 0) return;
      var file = this.files[0];
      switch (node.type) {
        case 'bucket':
          var formData = new FormData();
          formData.append('fileToUpload', file);
          formData.append('bucketKey', node.id);
  
          $.ajax({
            url: '/api/forge/oss/objects',
            data: formData,
            processData: false,
            contentType: false,
            type: 'POST',
            success: function (data) {
              $('#appBuckets').jstree(true).refresh_node(node);
            }
          });
          break;
      }
    });
  }
  
  function translateObject(node) {
    $("#forgeViewer").empty();
    if (node == null) node = $('#appBuckets').jstree(true).get_selected(true)[0];
    var bucketKey = node.parents[0];
    var objectKey = node.id;
    jQuery.post({
      url: '/api/forge/modelderivative/jobs',
      contentType: 'application/json',
      data: JSON.stringify({ 'bucketKey': bucketKey, 'objectName': objectKey }),
      success: function (res) {
        $("#forgeViewer").html('Translation started! Please try again in a moment.');
      },
    });
  }