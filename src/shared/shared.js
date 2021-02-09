export const drawShapefunction = (map, _finalObject, selectedColor, totalFacets = 0, isEdges = false, isFacets = false) => {
    _finalObject.shape.map((shp) => {
        for (var i = 0; i < shp.path.length; i++) {
            //  create a polyline
            var poly = new L.Polyline(shp.path[i], {
                color: selectedColor ? selectedColor : shp.path[i][0].color,
                dashArray: "5 5",
                lineCap: "round",
                weight: 3,
                opacity: 1,
                // showMeasurements: true,
                // measurementOptions: { imperial: true },
            }).addTo(map);

            var distance = L.latLng([
                shp.path[i][0].lat,
                shp.path[i][0].lng,
            ]).distanceTo([shp.path[i][1].lat, shp.path[i][1].lng]);

            shp.path[i][0]["length"] = `${distance.toFixed(1)} m`;
            shp.path[i][1]["length"] = `${distance.toFixed(1)} m`;

            poly.setText(`${distance.toFixed(1)} m`, {
                center: true,
                attributes: { fill: "yellow" },
                // orientation: "70",
            });
        }
    });

    //for facet page
    if (isFacets) {
        _finalObject.totalFacets = totalFacets;
    }
}
export const imageUrl = async (lat, lng, isMarker) => {
    if (isMarker) {
        return `https://maps.googleapis.com/maps/api/staticmap?zoom=17&size=600x300&maptype=satellite&markers=color:blue%7Clabel:S%7C${lat},${lng}&key=${process.env.VUE_APP_MAP_ID}`
    } else {
        return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=17&scale=1&size=600x300&maptype=satellite&format=png&visual_refresh=true&key=${process.env.VUE_APP_MAP_ID}`
    }
}
export const initLat = -41.2858;
export const initLng = 174.78682;
export const initZoom = 16;
