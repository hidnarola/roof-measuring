import $ from "jquery";

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
            }).addTo(map);

            var distance = L.latLng([
                shp.path[i][0].lat,
                shp.path[i][0].lng,
            ]).distanceTo([shp.path[i][1].lat, shp.path[i][1].lng]);

            var feet = (distance.toFixed(4) * 3.2808).toFixed(2);

            shp.path[i][0]["length"] = `${feet} ft`;
            shp.path[i][1]["length"] = `${feet} ft`;

            poly.setText(`${feet} ft`, { center: true, attributes: { fill: "yellow" } });
        }
    });

    //for facet page
    if (isFacets) {
        _finalObject.totalFacets = totalFacets;
    }
}
export const setAddress = (lat, lng) => {
    $.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        (data) => {
            var address = data.address.road + ', ' + data.address.city && data.address.city + ', ' + data.address.state + ', ' + data.address.country;
            //set address in finalObject
            let finalObject = JSON.parse(localStorage.getItem("finalObject"));
            if (finalObject === null) {
                let finalObject = {};
                finalObject.address = address;
                localStorage.setItem("finalObject", JSON.stringify(finalObject));
            } else {
                finalObject.address = address
                localStorage.setItem("finalObject", JSON.stringify(finalObject));
            }
        }
    );
}
export const imageUrl = async (lat, lng, isMarker) => {
    if (isMarker) {
        return `https://maps.googleapis.com/maps/api/staticmap?zoom=17&size=600x300&maptype=satellite&markers=color:blue%7Clabel:S%7C${lat},${lng}&key=${process.env.VUE_APP_MAP_ID}`
    } else {
        return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&scale=1&size=600x300&maptype=satellite&format=png&visual_refresh=true&key=${process.env.VUE_APP_MAP_ID}`
    }
}
export const initLat = -41.285836653571685;
export const initLng = 174.77876901626587;
export const initZoom = 16;
