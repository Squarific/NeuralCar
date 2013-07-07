<?php
	if (!$_POST) {
		exit('{"error": "Provide a score or a network."}');
	}
	require("config.php");
	$_POST['network'] = str_replace("\\", "", $_POST['network']);
	$res = $database->query("INSERT INTO cars (network, score) VALUES ('" . $database->escape_string($_POST['network']) . "', " . $database->escape_string($_POST['score']) . ")");
	if (!$res) {
		exit('{"error": "' . $database->error . '"}');
	}
	exit('{"success": "Succesfully saved car"}');
?>
