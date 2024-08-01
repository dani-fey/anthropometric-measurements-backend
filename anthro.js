// Global variables; see the code below for their purpose.
var headers;
var data_1;
var data_2;
var min_x;
var max_x;
var min_y;
var max_y;
var col_x = 100;  // Default x measurement is 100 = STATURE = body height.
var col_y = 124;  // Default y measurements is 124 = WEIGHT = body weight.
var show_1 = true;
var show_2 = true;
var color_1 = 0;
var color_2 = 1;
var color_ref = 2; // "rgb(255, 0, 0)";  // Red.
var lg_opacity = 0.2;
var user = "";
var userData = [];

// Main program code. The jQuery construct $(document).ready(function(){ ... }
// ensures that this is executed only when the page has been loaded.
$(document).ready(function() {
  // Get ANSUR headers and calls showMeasurements when done.
  getAnsurHeadersAndInitMeasurements();
});

// Initialize measurements table.
function initMeasurementsTable() {
  // Fill table.
  var measurementsTableRows = [];
  for (var i = 0; i < headers.length; i++) {
    measurementsTableRows[i] = 
      "<tr style=\"display: " + (headers[i][0] == 0 ? "none" : "table-row") + "\">" +
      // "<td class=\"measurements_radio\">" +
      //   "<input type=\"radio\" name=\"radio_colx\" /></td>" +
      "<td class=\"measurements_info\">" +
        "<img class=\"help_icon\" src=\"help.png\" /></td>" +
      "<td class=\"measurements_label\">" +
        "<span>" + headers[i][1] + "</span></td>" +
      "<td class=\"measurements_input\">" +
        "<input type=\"text\" /></td>" +
        // "<input type=\"text\" value=\"" + (userData[i] > 0 ? userData[i] : "") + "\" /></td>" +
      "<td class=\"measurements_unit\">" + 
        "<span>" + headers[i][2] + "</span></td>" +
    "</tr>";
  }
  var measurementsTableHtml = measurementsTableRows.join("\n") + "\n";
  $("#measurements_table").html(measurementsTableHtml);

  // Hide some additional random rows (just testing).
  $.each($("#measurements_table tr"), function(index, value) {
    // alert(value.children(".measurement_input > input").val());
  });
      
  // Parse parameters from hash, if it exists.
  getHash();

  // Add tooltips to help logos to the left of the measurement labels.
  for (var i = 0; i < headers.length; i++) {
    $(".measurements_info").eq(i).mouseover({i: i}, function(e) {
      var text = "<p><b>" + headers[e.data.i][1] + ":</b> " +
                 headers[e.data.i][4] + "</p>" +
                 "<p><i>Click to set vertical axis; " +
                 "ctrl+click to set horizontal axis.</i></p>";
      $(this).append("<div id=\"tooltip\">" + text + "</div>");
      $("#tooltip").css("top", e.pageY + 10);
      $("#tooltip").css("left", e.pageX + 200);
    }).mousemove(function(e) {
      $("#tooltip").css("top", e.pageY + 10);
      $("#tooltip").css("left", e.pageX + 20);
    }).mouseout(function() {
      $(this).children("div#tooltip").remove();
    });
  }

  // // Add tooltip to measurement labels (saying how to change the label at the
  // // x-axis or y-axis).
  // $(".measurements_label").mouseover(function() {
  //   var message = "Click to set y-axis; Ctrl + click to set x-axis.";
  //   $(this).append("<div id=\"tooltip\">" + message + "</div>");
  //   $("#tooltip").css("top", e.pageY + 10);
  //   $("#tooltip").css("left", e.pageX + 200);
  // }).mousemove(function(e) {
  //     $("#tooltip").css("top", e.pageY + 10);
  //     $("#tooltip").css("left", e.pageX + 20);
  // }).mouseout(function() {
  //     $(this).children("div#tooltip").remove();
  // });

  // When one of the *measurement labels* is clicked, change col_y accordingly
  // and update the plot. 
  $(".measurements_label,.measurements_info").click(function(e) {
    var index = Math.max($(this).index(".measurements_label"),
                         $(this).index(".measurements_info"));
    // If Ctrl or Shift pressed at the same time, change y-axis label. If this
    // already was the y-axis label before, do nothing. If this was the x-axis
    // label before, swap.
    if (e.ctrlKey || e.shiftKey) {
      if (index + 1 == col_x) return;
      if (index + 1 == col_y) col_y = col_x;
      col_x = index + 1;
    // Otherwise change x-axis label. If this already was the x-axis label
    // before, do nothing. If this was the y-axis label before, swap.
    } else {
      if (index + 1 == col_y) return;
      if (index + 1 == col_x) col_x = col_y;
      col_y = index + 1;
    }
    // Update label highlights, and plot new graph.
    updateColumnSelection(col_x, col_y);
    getAnsurDataAndPlot();
  });

  // When a text field is changed, and it is one of col_x or col_y, update the
  // plot.
  $("input:text").change(function() {
    var col = $(this).index("input:text") + 1;
    if (col == col_x || col == col_y) {
      // alert("Update plot");
      getAnsurDataAndPlot();
    }
  });

  // When one of the "show data" radio buttons (women only / men only / both
  // women and men) is clicked, redraw data.
  $("input:radio[name=\"radio_data\"]").click(function() {
    var index = $(this).index("input:radio[name=\"radio_data\"]");
    show_1 = true;
    show_2 = true;
    if (index == 0) show_2 = false;
    if (index == 1) show_1 = false;
    getAnsurDataAndPlot();
  });

  // Set radio button / label for default col_x / col_y (see global variables at
  // the beginning of the file).
  $("input:radio").eq(col_x - 1).attr("checked", true);
  $(".measurements_label > span").eq(col_y - 1).addClass("label_selected");

  // Show initial plot.
  updateColumnSelection(col_x, col_y);
  getAnsurDataAndPlot();
}

// Get parameters from hash (the URL part after the #), if it exists.
function getHash() {
  if (window.location.hash) {
    var parameters = window.location.hash.substring(1).split("&");
    // console.log(parameters);
    $.each(parameters, function(index, parameter) {
      var keyAndValue = parameter.split("=");
      if (keyAndValue.length == 2) {
        var key = keyAndValue[0];
        var value = keyAndValue[1];
        console.log(key + " = " + value);
        if (key == "user") { user = value; getUserData(user); }
        else if (key == "colx") { col_x = value; }
        else if (key == "coly") { col_y = value; }
      }
    })
    //var username = window.location.hash.substring(1);
    // getUserData(username);
  } 
}

// Set the hash (the URL part after the #).
function setHash() {
  var hashString = "#colx=" + col_x + "&coly=" + col_y;
  if (user != "") { hashString += "&user=" + user; }
  window.location.hash = hashString;
}

// Set col_x and col_y to new values and update the measurement display
// accordingly.
// NOTE: currently removes all highlights from all labels before adding the new
// ones. If this should ever become an efficiency issue, one could also remove
// the highlights from the old labels only.
function updateColumnSelection(col_x, col_y) {
  $(".measurements_label > span").removeClass("col_x");
  $(".measurements_label > span").removeClass("col_y");
  $(".measurements_label > span").eq(col_x - 1).addClass("col_x");
  $(".measurements_label > span").eq(col_y - 1).addClass("col_y");
  setHash();
}

// Compute data statistics (min_x, max_x, min_y, max_y).
// TODO(bast): also compute standard deviation for both data sets, so that we
// can draw a corresponding band around the regression line.
function computeDataStatistics() {
  min_x = 99999;
  min_y = 99999;
  max_x = 0;
  max_y = 0;
  for (var i = 0; i < data_1.length; i++) {
    if (data_1[i][0] < min_x) min_x = data_1[i][0];
    if (data_1[i][0] > max_x) max_x = data_1[i][0];
    if (data_1[i][1] < min_y) min_y = data_1[i][1];
    if (data_1[i][1] > max_y) max_y = data_1[i][1];
  }
  for (var i = 0; i < data_2.length; i++) {
    if (data_2[i][0] < min_x) min_x = data_2[i][0];
    if (data_2[i][0] > max_x) max_x = data_2[i][0];
    if (data_2[i][1] < min_y) min_y = data_2[i][1];
    if (data_2[i][1] > max_y) max_y = data_2[i][1];
  }
  // var stats = [min_x, max_x, min_y, max_y];
  // alert(stats.join(", "));
}

// Plot data.
function plotData() {
  computeDataStatistics();
  var lg_1 = linearRegression(data_1);
  var lg_2 = linearRegression(data_2);
  x_color = "rgb(0, 0, 0)";
  y_color = "rgb(0, 0, 0)";
  // y_color = "rgb(0, 0, 200)";
  var global_options = {
    xaxis: { min: min_x, max: max_x, color: x_color },
    yaxis: { min: min_y, max: max_y, color: y_color },
    // legend: { position: "ne" },
    // yaxis : [ { position: "right", min: min_y, max: max_y },
    //           { position: "left" , min: min_y, max: max_y } ],
  };
  var x_left = min_x;
  var x_right = max_x;
  var y_left_1 = lg_1["a"] * x_left + lg_1["b"];
  var y_right_1 = lg_1["a"] * x_right + lg_1["b"];
  var y_left_2 = lg_2["a"] * x_left + lg_2["b"];
  var y_right_2 = lg_2["a"] * x_right + lg_2["b"];
  var sigma_1 = lg_1["eps"];
  var sigma_2 = lg_2["eps"];
  var line_1 = [ [x_left, y_left_1 + sigma_1, y_left_1 - sigma_1 ],
                 [x_right, y_right_1 + sigma_1, y_right_1 - sigma_1 ] ];
  var line_2 = [ [x_left, y_left_2 + sigma_2, y_left_2 - sigma_2 ],
                 [x_right, y_right_2 + sigma_2, y_right_2 - sigma_2] ];
  // Show reference point, if we have the values for it.
  var value_x = $("input:text").eq(col_x - 1).val();
  var value_y = $("input:text").eq(col_y - 1).val();
  var show_ref = (value_x > 0 && value_y > 0);
  var ref = [ [value_x, value_y] ];
  // Finally, plot (1) the two point clouds (women and men), (2) the two
  // regression lines, and (3) the reference point if available.
  var plot = $.plot($("#plot_canvas"), [
      { data: (show_2 ? data_2 : []),
        points: { show: true, symbol: "circle", lineWidth: 1.4 },
        label: "men",
        color: color_2 },
      { data: (show_1 ? data_1 : []),
        points: { show: true, symbol: "circle", lineWidth: 1.4 },
        label: "women",
        color: color_1 },
      { data: (show_1 ? line_1 : []),
        lines: { show: true, lineWidth: 0, fill: lg_opacity },
        color: color_1 },
      { data: (show_2 ? line_2 : []),
        lines: { show: true, lineWidth: 0, fill: lg_opacity },
        color: color_2 },
      show_ref ? { data: ref,
        label: "YOU",
        points: { show: true, symbol: "circle", radius: 3, lineWidth: 6 },
        color: color_ref } : { },
  ], global_options);

  // Update plot footer (say which measurement is on x-axis).
  var header_x = headers[col_x - 1][1];
  var header_y = headers[col_y - 1][1];
  header_x = header_x.toLowerCase();
  header_y = header_y.toLowerCase();
  // header_x = header_x.charAt(0).toLowerCase() + header_x.slice(1);
  // header_y = header_y.charAt(0).toLowerCase() + header_y.slice(1);
  var help_tooltip =
    "If you click on one of the non-highlighted labels, " +
    "that label will be made the new label for the y-axis. " +
    "If you click on an already highlighted label, the labels " +
    "of the x-axis and y-axis will be swapped.";
  $("#plot_footer").html(
      "Relation between " +
      "<span class=\"col_x\">" + header_x + "</span> (horizontal axis) and " +
      "<span class=\"col_y\">" + header_y + "</span> (vertical axis)");
  //  "click in the list on the left to change or swap&nbsp;&nbsp;" +
  //  "<img class=\"help_icon\" src=\"help.png\" title=\"" + help_tooltip + "\" />");
}


// Error callback.
function errorCallback(json) {
  alert("Error calling anthro.php:\n" + json.message);
}

// Get headers from ANSUR data.
function getAnsurHeadersAndInitMeasurements() {
  var url = "anthro.php?mode=headers";
  $.ajax(url, { dataType: "jsonp" });
  // Will call getAnsurHeadersCallback when done.
}

function getAnsurHeadersCallback(json) {
  // console.log(json.headers);
  headers = json.headers;
  initMeasurementsTable();
}

// Get user data.
function getUserData(name) {
  var url = "anthro.php?mode=user&name=" + name;
  $.ajax(url, { dataType: "jsonp" });
}

function getUserDataCallback(json) {
  userData = json.data;
  for (var i = 0; i < headers.length; i++) {
    if (userData[i] > 0) {
      $(" .measurements_input > input").eq(i).val(userData[i]);
    }
  }
}

// Get ANSUR data for the two columns specified.
function getAnsurDataAndPlot() {
  if (col_y <= 0) return;
  var scale_x = headers[col_x - 1][3];
  var scale_y = headers[col_y - 1][3];
  var url = "anthro.php" +
            "?mode=data" +
            "&colx=" + col_x + "&coly=" + col_y +
            "&scalex=" + scale_x + "&scaley=" + scale_y;
  $.ajax(url, { dataType: "jsonp" });
}

function getAnsurDataCallback(json) {
  // alert(json.col_1 + ", " + json.col_2 + ", " + json.size_1 + ", " + json.size_2);
  data_1 = json.data_1;
  data_2 = json.data_2;
  plotData();
}

function linearRegression(data) {
  var sumx = 0, sumy = 0, sumx2 = 0, sumy2 = 0, sumxy = 0;
  var n = data.length;
  for(var i = 0; i < n; i++) {   
    var x = data[i][0];
    var y = data[i][1]; 
    // NOTE: consider checking for NaN in the x, y and r variables here 
    // (add a continue statement in that case)
    sumx += x;
    sumx2 += x*x;
    sumy += y;
    sumy2 += y*y;
    sumxy += x*y;
  }
  // NOTE: the denominator is the variance of the random variable X
  // the only case when it is 0 is the degenerate case X==constant
  var varx = n * sumx2 - sumx * sumx;
  var vary = n * sumy2 - sumy * sumy;
  var a = (n * sumxy - sumx * sumy) / varx;
  var b = (sumy * sumx2 - sumx * sumxy) / varx;
  var eps = Math.sqrt(vary - a * a * varx) / n;
  // alert(a + ", " + b + ", " + eps);
  return { a: a, b: b, eps: eps };
}

// Flot callback for drawing a cross instead of a circle. Taken from:
// http://people.iola.dk/olau/flot/API.txt.
function cross(ctx, x, y, radius, shadow) {
  var size = radius * Math.sqrt(Math.PI) / 2;
  ctx.moveTo(x - size, y - size);
  ctx.lineTo(x + size, y + size);
  ctx.moveTo(x - size, y + size);
  ctx.lineTo(x + size, y - size);
}
