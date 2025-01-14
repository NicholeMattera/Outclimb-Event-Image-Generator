export default class ImageGenerator {
    constructor (onLoadCallback) {
        this.onLoadCallback = onLoadCallback;

        // Initialization
        this.canvas = document.querySelector('#preview-canvas');
        this.context = this.canvas.getContext('2d');
        this.rainbowGradient = [
            { offset: 0, color: '#E60000' },
            { offset: 0.2, color: '#FF8E00' },
            { offset: 0.4, color: '#FFEF00' },
            { offset: 0.6, color: '#00821B' },
            { offset: 0.8, color: '#004BFF' },
            { offset: 1, color: '#770089' }
        ];
        this.loadMap = {
            backgroundImage: false,
            boldFont: false,
            mediumFont: false,
            logoImage: false
        };

        // Load Fonts
        this.montserratBold = new FontFace('MonterratBold', 'url(fonts/montserrat-bold.ttf)');
        this.montserratBold.load().then(this._assetLoaded('boldFont', 'font').bind(this));
        this.montserratMedium = new FontFace('MonterratMedium', 'url(fonts/montserrat-medium.ttf)');
        this.montserratMedium.load().then(this._assetLoaded('mediumFont', 'font').bind(this));

        // Load Images
        this.backgroundImage = new Image();
        this.backgroundImage.addEventListener('load', this._assetLoaded('backgroundImage', 'image').bind(this));
        this.backgroundImage.src = 'images/background.webp';
        this.logoImage = new Image();
        this.logoImage.addEventListener('load', this._assetLoaded('logoImage', 'image').bind(this));
        this.logoImage.src = 'images/logo.webp';
    }

    _assetLoaded (assetName, assetType) {
        return (asset) => {
            this.loadMap[assetName] = true;

            if (assetType === 'font') {
                document.fonts.add(asset);
            }

            if (Object.values(this.loadMap).every((loaded) => loaded)) {
                this.onLoadCallback();
            }
        }
    }

    _drawBackground (dimens) {
        // Clear canvas
        this.context.fillRect(0, 0, dimens.width, dimens.height);

        // Draw Background Image
        this.context.drawImage(
            this.backgroundImage,
            0,
            0,
            this.backgroundImage.width,
            this.backgroundImage.height
        );

        // Draw Rainbow Overlay
        const gradient = this.context.createLinearGradient(0, 0, dimens.width, dimens.height);
        this.rainbowGradient.forEach(({ offset, color }) => gradient.addColorStop(offset, color));
        this.context.globalCompositeOperation = 'screen';
        this.context.fillStyle = gradient;
        this.context.fillRect(0, 0, dimens.width, dimens.height);
        this.context.globalCompositeOperation = 'source-over';

        // Draw Logo
        this.context.drawImage(
            this.logoImage,
            (dimens.width - this.logoImage.width) / 2,
            (dimens.details.headerHeight - this.logoImage.height) / 2, 
            this.logoImage.width,
            this.logoImage.height
        );

        // Return context properties back to default
        this.context.fillStyle = '#000000';
    }

    _drawEvents (data, dimens) {
        this.context.fillStyle = '#000000';
        this.context.font = '32px MonterratBold';

        // Draw Month
        const month = data.month.toUpperCase();
        const monthDimens = this.context.measureText(month);
        const monthCenterAlignX = (dimens.details.dayWidth - monthDimens.width) / 2;
        this.context.fillText(month, monthCenterAlignX, dimens.details.headerHeight - dimens.details.eventGap, dimens.details.dayWidth);

        // Draw Events
        data.events.forEach(({ day, name, location, detailsNum }, index) => {
            this.context.font = '32px MonterratBold';

            const { dayWidth, headerHeight, eventGap, eventHeight } = dimens.details
            const hasLocation = location.length > 0;

            const backgroundY = headerHeight + (eventHeight + eventGap) * index;
            const centerAlignY = headerHeight + ((128 + 16) * index) + 75;

            this.context.fillStyle = 'rgba(255, 255, 255, 0.8)';

            // Day Background
            this.context.beginPath();
            this.context.roundRect(-8, backgroundY, dayWidth + 8, eventHeight, 8);
            this.context.fill();

            // Name Background
            this.context.beginPath();
            this.context.roundRect(dayWidth + eventGap, backgroundY, 1088 - (dayWidth + eventGap), eventHeight, 8);
            this.context.fill();

            this.context.fillStyle = '#000000';

            // Day Text
            const dayDimens = this.context.measureText(day.toUpperCase());
            const dayCenterAlignX = (dayWidth - dayDimens.width) / 2;
            this.context.fillText(day.toUpperCase(), dayCenterAlignX, centerAlignY, dayWidth);

            // Name text
            const nameLocationWidth = dimens.width - (dayWidth + 48);
            this.context.fillText(name.toUpperCase(), dayWidth + 32, (hasLocation) ? centerAlignY - 16 : centerAlignY, nameLocationWidth);

            // Details Number
            if (detailsNum !== 0) {
                const nameDimens = this.context.measureText(name.toUpperCase());

                this.context.font = '16px MonterratMedium';
                let detailsNumX = dayWidth + 40 + nameDimens.width;
                if (detailsNumX > dimens.width - 32) {
                    const detailsNumDimens = this.context.measureText(detailsNum.toString());
                    detailsNumX = dimens.width - detailsNumDimens.width - 8;
                }

                this.context.fillText(detailsNum.toString(), detailsNumX, (hasLocation) ? centerAlignY - 28 : centerAlignY - 12);
            }

            // Location Text
            if (hasLocation) {
                this.context.font = '24px MonterratMedium';
                this.context.fillText(location, dayWidth + 32, centerAlignY + 16, nameLocationWidth);
            }
        });

        // Return context properties back to default
        this.context.fillStyle = '#000000';
    }

    _drawInformation (lines, dimens) {
        const footerTop = dimens.details.headerHeight + dimens.details.contentHeight;

        if (lines.length !== 0) {
            this.context.fillStyle = 'rgba(255, 255, 255, 0.8)';

            // Information Background
            this.context.beginPath();
            this.context.roundRect(
                dimens.details.eventGap,
                footerTop,
                dimens.width - dimens.details.eventGap * 2,
                dimens.details.informationHeight,
                8
            );
            this.context.fill();    

            // Draw Information
            this.context.fillStyle = '#000000';
            this.context.font = '24px MonterratMedium';
            this.context.textBaseline = 'top';
            lines.forEach((line, index) => {
                this.context.fillText(
                    line,
                    32,
                    footerTop + dimens.details.eventGap + 28 * index,
                    dimens.width - dimens.details.eventGap * 4
                );
            });
        }

        // Return context properties back to default
        this.context.fillStyle = '#000000';
        this.context.filter = 'none';
        this.context.textBaseline = 'alphabetic';
    }

    _getDimensions (data, informationLines) {
        const dayWidth = 256;
        const eventGap = 16;
        const eventHeight = 128;
        const headerHeight = 200;
        const informationHeight = (informationLines.length === 0) ? 0 : eventGap * 2 + 28 * informationLines.length
        const width = 1080;

        const details = {
            contentHeight: data.events.length * (eventHeight + eventGap),
            dayWidth,
            eventGap,
            eventHeight,
            footerHeight: (informationLines.length === 0) ? headerHeight - eventGap : eventGap + informationHeight, // TODO: There maybe something here
            headerHeight,
            informationHeight
        };

        return {
            details,
            height: details.footerHeight + details.contentHeight + details.headerHeight,
            width
        }
    }

    _generateMultilineText (topDetails, events, bottomDetails) {
        this.context.font = '24px MonterratMedium';

        const lines = [];
        const lineFunction = (line) => {
            let workingLine = [];
            line.split(' ').forEach((word) => {
                const lineDimens = this.context.measureText(workingLine.join(' ') + ' ' + word);
                if (lineDimens.width > 1016) { 
                    lines.push(workingLine.join(' '));
                    workingLine = [];
                }
                
                workingLine.push(word);
            });

            if (workingLine.length > 0) {
                lines.push(workingLine.join(' '));
            }
        };

        const topLines = topDetails.split('\n');
        const bottomLines = bottomDetails.split('\n');

        topLines.forEach(lineFunction);

        events.forEach(({ details, detailsNum }) => {
            if (details.length === 0) return;

            if (lines.length > 0) lines.push([]);
            `${detailsNum}. ${details}`.split('\n').forEach(lineFunction);
        });

        if (lines.length > 0 && bottomDetails.length > 0) lines.push([]);
        bottomLines.forEach(lineFunction);

        return lines;
    }

    generatePreview (data) {
        const informationLines = this._generateMultilineText(data.topDetails, data.events, data.bottomDetails);

        const dimens = this._getDimensions(data, informationLines);
        this.canvas.width = dimens.width;
        this.canvas.height = dimens.height;

        this._drawBackground(dimens);
        this._drawEvents(data, dimens);
        this._drawInformation(informationLines, dimens);
    }

    getDownloadURL () {
        return this.canvas.toDataURL('image/png');
    }
}
