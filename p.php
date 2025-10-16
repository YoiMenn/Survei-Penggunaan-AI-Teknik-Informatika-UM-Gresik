<!DOCTYPE html>
<html>
<head>
    <title>Kalkulator Sederhana</title>
</head>
<body>
    <h2>Kalkulator Penjumlahan</h2>
    <form method="post" action="">
        <input type="number" name="angka1" required> +
        <input type="number" name="angka2" required>
        <input type="submit" value="Hitung">
    </form>

    <?php
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $a = $_POST['angka1'];
        $b = $_POST['angka2'];
        $hasil = $a + $b;
        echo "<h3>Hasil: $a + $b = $hasil</h3>";
    }
    ?>
</body>
</html>
