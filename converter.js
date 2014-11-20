var main = (function() {
    "use strict";
    /*
         Converts any image supported by the browser, to an XBM image.
         Optimized for LCD displays. Tested with an 12864ZW LCD display with U8GLib for Arduino.
         IMAGE FORMAT: LSB Horizontal, 8 pixels per byte
         Copyright © 2013 Victor Norgren. All rights reserved.
         */
    var MAX_IMAGE_SIZE = 1960,
        init;

    var Processor = {
        init: function () {
            this._canvasInput = document.getElementById("input");
            this._canvasOutput = document.getElementById("output");
            this._contextInput = this._canvasInput.getContext("2d");
            this._contextOutput = this._canvasOutput.getContext("2d");
            this._valuePanel = document.getElementById("result");
            this._img = null;

            this.threshold = Math.round(255 * .4);

            this._$thresholdText = document.getElementById('currentThreshold');
            this._$threshold = document.getElementById('threshold');
            this._$sizeInfo = document.getElementById('sizeInfo');

            this._$thresholdText.innerText = this.threshold;
            this._$threshold.addEventListener('change', this.onUpdateThreshold.bind(this));
            document.getElementById('defaultThreshold').addEventListener('click', this.onResetThreshold.bind(this));
        },
        onResetThreshold: function () {
            this._$threshold.value = 40;
            this.threshold = Math.round(255 * .4);
            this._$thresholdText.innerText = this.threshold;
            this.drawInput();
        },
        onUpdateThreshold: function (e) {
            this.threshold = Math.round(255 * parseInt(e.target.value)/100);
            this._$thresholdText.innerText = this.threshold;
            this.drawInput();
        },
        clearData: function() {
            this._contextInput.clearRect(0, 0, this._canvasInput.width, this._canvasInput.height);
            this._contextOutput.clearRect(0, 0, this._canvasOutput.width, this._canvasOutput.height);
            this._valuePanel.value = "";
        },
        setImage: function (img) {
            this._img = img;
        },
        drawInput: function(image) {

            if (!this._img) {
                alert('Please give a correct image');
            }
            image = this._img;
            this.clearData();
            this.__imgWidth = image.width;
            this.__imgHeight = image.height;

            this._$sizeInfo.innerText = this.__imgWidth + ' x ' + this.__imgHeight;

            console.log(this.__imgWidth, this.__imgHeight);
            // input
            this._canvasInput.width = this.__imgWidth;
            this._canvasInput.height = this.__imgHeight;
            // ouput
            this._canvasOutput.width = this.__imgWidth;
            this._canvasOutput.height = this.__imgHeight;

            // input-content
            this._contextInput.drawImage(image, 0, 0, this.__imgWidth, this.__imgHeight);
            this.drawOutput();

        },
        drawOutput: function() {
            var data,
                imageData,
                WHITE = 255,
                BLACK = 0;

            imageData = this._contextOutput.createImageData(this.__imgWidth, this.__imgHeight);
            data = this._contextInput.getImageData(0, 0, this.__imgWidth, this.__imgHeight).data;
            var len = data.length;
            // If color image, invert colors
            // if (!Processor.imageIsMonochrome(this._canvasInput)) {
            //     WHITE = 0;
            //     BLACK = 255;
            // }
            for (var index = 0; index < len; index += 4) {
                var alpha = data[index + 3];

                if ((data[index] + data[index + 1] + data[index + 2]) >= (this.threshold * 3)) {
                    imageData.data[index] = WHITE;
                    imageData.data[index + 1] = WHITE;
                    imageData.data[index + 2] = WHITE;
                    imageData.data[index + 3] = 255;
                } else {
                    imageData.data[index] = BLACK;
                    imageData.data[index + 1] = BLACK;
                    imageData.data[index + 2] = BLACK;
                    imageData.data[index + 3] = 255;
                }
            };
            this._contextOutput.putImageData(imageData, 0, 0);
            this._valuePanel.value = this.writeByteArray();
        },
        imageIsMonochrome: function(inputcanvas) {
            var isMonochrome = true;
            var data = inputcanvas.getContext('2d').getImageData(0, 0, inputcanvas.width, inputcanvas.height).data;
            var len = data.length;
            for (var index = 0; index < len; index += 4) {
                if ((data[index] !== 0 && data[index] !== 255) ||
                    (data[index + 1] !== 0 && data[index + 1] !== 255) ||
                    (data[index + 2] !== 0 && data[index + 2] !== 255)) {
                    isMonochrome = false;
                    return isMonochrome;
                }
            };
            return isMonochrome;
        },
        writeByteArray: function() {
            var imgData = this._contextOutput.getImageData(0, 0, this.__imgWidth, this.__imgHeight).data,
                len = imgData.length,
                bit = 0,
                cols = 0,
                binary = '',
                resultBuffer = '';

            for (var i = 0, index = 0; index < len; i++, index += 4) {
                bit = (imgData[index] === 255) ? 0 : 1;
                binary += bit;
                if (binary.length === 8) {
                    resultBuffer += 'B' + binary + ','
                    binary = '';
                    cols++;
                }
            }
            resultBuffer = resultBuffer.replace(/\,\s*$/, '\n');

            return resultBuffer;
        }
    };
    function imageScale (image, maxWidth, maxHeight) {
        var width = image.width;
        var height = image.height;
        var limitScale,
            scale

        if (maxWidth == 'auto' && maxHeight == 'auto') {
            // auto size
        } else if (maxHeight == 'auto' && width >= maxWidth) {
            height = height * maxWidth / width;
            width = maxWidth;
        } else  if (maxWidth == 'auto' && height >= maxHeight) {
            width = width * maxHeight / height;
            height = maxHeight;
        } else if ( (width > maxWidth && (height * maxWidth / width) > maxHeight) || 
            (height > maxHeight && (width * maxHeight/height) > maxWidth ) ) {
            limitScale = maxWidth/maxHeight;
            scale = width/height;

            if (scale > limitScale) {
                width = maxWidth;
                height = maxWidth/scale;
            } else {
                height = maxHeight;
                width = maxHeight*scale;
            }
        } else if (width > maxWidth) {
            height *= maxWidth/width;
            width = maxWidth;
        } else if (height > maxHeight) {
            width *= maxHeight/height;
            height = maxHeight;
        }
        height = Math.floor(height);
        width = Math.floor(width);

        image.width = width;
        image.height = height;
    }

    function fileHandler(event) {
        var files = event.dataTransfer.files,
            reader;
        event.stopPropagation();
        event.preventDefault();

        if (!files[0].type.match("image.*")) {
            alert("Please select a single image file (jpg/png/gif)");
            return;
        }
        reader = new FileReader();
        reader.onload = (function(file) {
            return function(event) {
                var image = new Image();
                image.style.maxWidth = 128;
                image.onload = function() {
                    if (this.width > MAX_IMAGE_SIZE || this.height > MAX_IMAGE_SIZE) {
                        alert("Image too large (max size " + MAX_IMAGE_SIZE + "px)");
                        return;
                    }
                    imageScale(this, 128, 64);
                    // if (this.width > 128) {
                    //     this.height = Math.round(this.height*128/this.width)
                    //     this.width = 128;
                    // }
                    Processor.setImage(this);
                    Processor.drawInput();
                };
                image.src = event.target.result;
            };
        }(files[0]));
        reader.readAsDataURL(files[0]);
    };
    function dragOverHandler(event) {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
    };
    init = function() {
        Processor.init();
        var dropZone, image;
        dropZone = document.getElementById("dropZone");
        dropZone.addEventListener("dragover", dragOverHandler, false);
        dropZone.addEventListener("drop", fileHandler, false);

        /**
         *  inital image
         **/
        image = new Image();
        image.src = "img.gif";
        image.onload = function() {
            Processor.setImage(this);
            Processor.drawInput();
        };
    };
    return {
        init: function() {
            init();
        }
    };
}());
window.addEventListener("load", main.init, false);
