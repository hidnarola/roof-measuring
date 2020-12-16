<template>
  <div id="home">
    <ul class="nav">
      <li class="nav-item"> <a class="nav-link" :class="{ active: isOpenFirst === true }" href="javascript:void(0)" @click="openDiv(`first`)">Draw</a></li>
      <li class="nav-item"><a class="nav-link" :class="{ active: isOpenSecond === true }" href="javascript:void(0)" @click="openDiv(`second`)" >Edges</a></li>
    </ul>
    <div v-if="isOpenFirst">
      <Draw />
    </div>
    <div v-if="isOpenSecond">
      <Edges />
    </div>
  </div>
</template>

<script>
import Draw from "../Search/index";
import Edges from "../Search/Edges";
export default {
  name: "home",
  components: {
    Draw,
    Edges,
  },
  data() {
    return {
      isOpenFirst: true,
      isOpenSecond: false,
    };
  },
  methods: {
    openDiv(open) {
      if (open === "first") {
        this.isOpenFirst = true;
        this.isOpenSecond = false;
      } else if (open === "second") {
        this.isOpenSecond = true;
        this.isOpenFirst = false;

      }
    },
  },
};
</script>

<style >
#home {
  padding: 0 !important;
}

#home ul.nav
{
  margin-bottom: 2px;
}
#home ul.nav li .nav-link
{
    font-size: 14px;
    color: #9c9c9c;
    font-weight: 400;
    border-bottom: 6px solid transparent;
    margin-right: 10px;
    padding: 16px;
    transition: all 0.3s linear;
}
#home ul.nav li .nav-link.active
{
  border-bottom:6px solid #259ad7;
}
</style>
