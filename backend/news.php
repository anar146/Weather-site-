<?php
// --- CONFIGURATION ---
$apiKey = '';
header('Content-Type: application/json');

$query = 'weather'; // Default query
if (isset($_GET['q']) && !empty($_GET['q'])) {
    $query = $_GET['q'];
}
$encodedQuery = urlencode($query);
$url = "https://gnews.io/api/v4/search?q={$encodedQuery}&lang=en&max=5&apikey={$apiKey}";

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'User-Agent: Dhyani-ClimaGlobe-App' 
]);

$response = curl_exec($ch);

if ($response === false) {
    $error_msg = curl_error($ch);
    curl_close($ch);
    echo json_encode(['status' => 'error', 'message' => 'cURL failed: ' . $error_msg]);
} else {
    curl_close($ch);
    echo $response;
}
?>
