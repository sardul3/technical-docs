<template>
  <span :class="labelClass">
    {{ text }}
  </span>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'primary', // default type is 'primary'
      validator(value) {
        return ['primary', 'secondary', 'version', 'milestone'].includes(value);
      }
    }
  },
  computed: {
    labelClass() {
      const baseClass = 'inline-block px-4 py-1 text-sm font-semibold rounded-full align-middle'; // align-middle for height adjustment
      const colorClasses = {
        primary: 'bg-blue-500 text-white',
        secondary: 'bg-gray-500 text-white',
        version: 'bg-green-500 text-white',
        milestone: 'bg-yellow-500 text-black'
      };
      return `${baseClass} ${colorClasses[this.type]}`;
    }
  }
}
</script>

<style scoped>
/* If you want to add any custom styles */
</style>
