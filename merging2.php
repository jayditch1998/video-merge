<?php
$content = "";
    // for ($a = 0; $a < count($_FILES["videos"]["name"]); $a++)
    // {
    //     $content .= "file " . $_FILES["videos"]["name"][$a] . "\n";
    // }
    file_put_contents("mylist.txt", $content);
 
    $command = "C:/ffmpeg/bin/ffmpeg -f concat -safe 0 -i mylist.txt -c copy output.mp4";
    system($command);
    echo 'success';