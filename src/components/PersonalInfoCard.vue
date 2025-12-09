<script setup>
defineProps({
  title: { type: String, default: 'Personal Information' },
  showEdit: { type: Boolean, default: true },

  avatar: { type: String, default: 'https://i.pravatar.cc/150?img=8' },
  fullName: { type: String, required: true },
  firstName: { type: String, default: '-' },
  lastName: { type: String, default: '-' },
  email: { type: String, default: '-' },
  roomNumber: { type: String, default: null },
  lineId: { type: String, default: null },
  contact: { type: String, default: null }
})
function display(value) {
  if (!value || value.trim() === '') return '-'
  return value
}
defineEmits(['edit'])
</script>
<template>
  <div class="bg-white rounded-2xl shadow p-6 md:p-8 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl max-sm:text-xl font-bold text-[#185dc0]">
        {{ title }}
      </h2>

      <button
        v-if="showEdit"
        @click="$emit('edit')"
        class="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl shadow transition max-sm:px-3 max-sm:py-1.5 max-sm:text-sm"
      >
        Edit Profile
      </button>
    </div>

    <div
      class="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-50"
    >
      <div class="flex flex-col items-center w-full md:w-1/3">
        <div
          class="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-blue-600 shadow"
        >
          <img :src="avatar" alt="Profile" class="w-full h-full object-cover" />
        </div>

        <p class="mt-3 text-gray-700 font-medium text-center md:text-left">
          {{ fullName }}
        </p>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 w-full md:w-2/3 text-gray-700"
      >
        <div>
          <label class="block font-semibold text-[#185dc0] mb-1"
            >Firstname</label
          >
          <p>{{ firstName }}</p>
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1"
            >Lastname</label
          >
          <p>{{ lastName }}</p>
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1">Email</label>
          <p>{{ email }}</p>
        </div>

        <div v-if="roomNumber !== null">
          <label class="block font-semibold text-[#185dc0] mb-1"
            >Room Number</label
          >
          <p>{{ roomNumber }}</p>
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1">Line ID</label>
          <p>{{ display(lineId) }}</p>
        </div>

        <div>
          <label class="block font-semibold text-[#185dc0] mb-1">Contact</label>
          <p>{{ display(contact) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
