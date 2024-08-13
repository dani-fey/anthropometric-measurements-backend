<?php
  header('content-type: application/json; charset=utf-8');

  $timer_start = microtime(true);

  $columnDataMap = array();
  $ansurData = array();

  function generateColumnData() {
    $tmpColumnData = array();
    foreach (file("ansur_headers.txt") as $index => $value) {
      $tmp = explode("\t", str_replace("\n", "", $value));

      $include = boolval($tmp[0]);
      $scale = intval($tmp[2]);
      $id = $tmp[3];
      $label = ($tmp[4] != "" ? $tmp[4] : $tmp[3]);
      $description = ($tmp[5] != "" ? $tmp[5] : "No further description available (yet).");
      $data = array("include" => $include, "unit" => $tmp[1], "scale" => $scale, "id" => $id, "index" => $index, "label" => $label, "description" => $description);
      
      $tmpColumnData = $tmpColumnData + array($id => $data);
    }
    return $tmpColumnData;
  }

  function generateAnsurData() {
    $tmpAnsurData = array();
    $dataSets = array(file("ansur_women.txt"), file("ansur_men.txt"));
    foreach ($dataSets as $_ => &$dataSet) {
      array_shift($dataSet);
      foreach ($dataSet as $_ => $line) {
        $tmp = explode("\t", str_replace("\n", "", $line));
        array_push($tmpAnsurData, $tmp);
      }
    }
    return $tmpAnsurData;
  }

  if (count($columnDataMap) == 0) {
    $columnDataMap = generateColumnData();
  }

  if (count($ansurData) == 0) {
    $ansurData = generateAnsurData();
  }
  
  // Case 1: Return ANSUR headers.
  if ($_GET["mode"] == "headers") {
    $time = microtime(true) - $timer_start;
    echo json_encode(array("data" => $columnDataMap, "time" => $time));
    return;
  }

  // Case 2: Return ANSUR data (for the given columns).
  // NOTE: all numbers divided by 10, since ANSUR measurements are in cm and kg with 
  // one digit of precision, and multiplied by 10, so that they can all be 
  // represented by integers. But for humans a body weight of 740 (for 74 kg) or 
  // a body height of 1870 (for 186cm) is confusing of course.
  if ($_GET["mode"] == "data") {
    $columnIds = explode(",", $_GET["columns"]);
    $results = array();
    foreach ($ansurData as $datum) {
      $result = array();
      foreach ($columnIds as $columnId) {
        $columnData = $columnDataMap[$columnId];
        $index = $columnData["index"];
        $scale = $columnData["scale"];
        $value = intval($datum[$index]) / intval($scale);
        $result = $result + array($columnId => $value);
      }
      array_push($results, $result);
    }

    $time = microtime(true) - $timer_start;
    echo json_encode(array("time" => $time, "data" => $results));
    return;
  }

  // CASE 3: no other modes.
  $message = "\"mode\" must be \"headers\" or \"data\"";
  echo json_encode(array("message" => $message));
?>