<?php
  header('content-type: application/json; charset=utf-8');
  
  // Case 1: Return ANSUR headers.
  if ($_GET["mode"] == "headers") {
    $headers = file("ansur_headers.txt");
    foreach ($headers as $key => &$val) {
      $tmp = explode("\t", $val);
      $label = ($tmp[4] != "" ? $tmp[4] : $tmp[3]);
      $description = ($tmp[5] != "" ? $tmp[5] : "No further description available (yet).");
      $val = array(intval($tmp[0]), trim($label), trim($tmp[1]), intval($tmp[2]), trim($description));
    }
    echo "getAnsurHeadersCallback({ headers: " . json_encode($headers) . " })";
    return;
  }

  // Case 2: Get user data.
  if ($_GET["mode"] == "user") {
    $data = file($_GET["name"] . ".txt");
    foreach ($data as $key => &$val) { 
      $tmp = explode("\t", $val);
      $val = floatval($tmp[0]);
    }
    echo "getUserDataCallback({ data: " . json_encode($data) . "})";
    return;
  }

  // Case 3: Return ANSUR data (for the two given columns).
  // NOTE: all numbers divided by 10, since ANSUR measurements are in cm and kg with 
  // one digit of precision, and multiplied by 10, so that they can all be 
  // represented by integers. But for humans a body weight of 740 (for 74 kg) or 
  // a body height of 1870 (for 186cm) is confusing of course.
  if ($_GET["mode"] == "data") {
    $timer_start = microtime(true);
    $data_sets = array(file("ansur_women.txt"), file("ansur_men.txt"));
    $col_x = intval($_GET["colx"]);
    $col_y = intval($_GET["coly"]);
    $scale_x = intval($_GET["scalex"]);
    $scale_y = intval($_GET["scaley"]);
    foreach ($data_sets as $key => &$data_set) {
      array_shift($data_set);
      foreach ($data_set as $key => &$val) { 
        $tmp = explode("\t", $val);
        $val = array(intval($tmp[$col_x - 1]) / $scale_x,
                     intval($tmp[$col_y - 1]) / $scale_y);
        // If one of the two values is negative, remove that element from the 
        // array. For example, this happens for INTERPUPILLARY_DIST and various 
        // other measurements.
        if ($val[0] < 0 || $val[1] < 0) {
          unset($data_set[$key]);
        }
      }
      // This will make it an ordinary array again. Otherwise, with values 
      // deleted with unset above, it will become an associative array, which is 
      // not what the java script wants.
      $data_set = array_values($data_set);
    }
    $timer_end = microtime(true);
    $time = $timer_end - $timer_start;
    echo "getAnsurDataCallback({" .
      " time: " . json_encode(1000 * $time) . "," .
      " col_1: " . json_encode($col_x) . "," .
      " col_2: " . json_encode($col_y) . "," .
      " size_1: " . json_encode(sizeof($data_sets[0])) . "," .
      " size_2: " . json_encode(sizeof($data_sets[1])) . "," .
      " data_1: " . json_encode($data_sets[0]) . "," .
      " data_2: " . json_encode($data_sets[1]) . "," .
      " })";
    return;
  }

  // CASE 3: no other modes.
  $message = "\"mode\" must be \"headers\" or \"data\"";
  echo "errorCallback({ message : " . json_encode($message) . " })";
?>
