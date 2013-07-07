<?php
	session_start();
	$mysql_host = "localhost";
	$mysql_database = "urban_car";
	$mysql_user = "urban_car";
	$mysql_password = "Kp0va74M";
	$database = new mysqli($mysql_host, $mysql_user, $mysql_password, $mysql_database);
	$errors = array();
	if (mysqli_connect_errno()) {
		$errors[] = "There was a problem with the database, please wait until we resolve this issue.";
	}
?>
