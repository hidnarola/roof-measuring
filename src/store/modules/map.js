export default {
    state: {
        title: 'map',
        latlngsArray: [],
        place: null
    },
    mutations: {
        UPDATE_LATLNGS: (state, payload) => {
            console.log('payload => ', payload, JSON.parse(JSON.stringify(payload)));
            state.latlngsArray = payload;
        },
        SELECTED_PLACE: (state, payload) => {
            console.log('payload => ', payload);
            // let finalData = JSON.parse(localStorage.getItem("finalObject"))
            // console.log('vue finalData => ', finalData);
            // finalData.address = payload;

            // if (finalData && finalData.address) {
            //     console.log('vue Hii in if');
            //     finalData.address = payload
            // } else {
            //     console.log('vue Hii in else');
            //     _finalObject.address = {
            //         ..._finalObject.address,
            //         address: address
            //     };
            // }
            // console.log('vue finalData after => ', finalData);
            // let finalData = localStorage.setItem("finalObject", JSON.stringify((finalData)))
            state.place = payload;
        },
    }
}
