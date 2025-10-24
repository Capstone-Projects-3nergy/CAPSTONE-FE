import { createRouter, createWebHistory } from 'vue-router'
import HomePageResident from '@/components/HomePageResident.vue'
import ParcelScannerPage from '@/components/ParcelScannerPage.vue'
import ResidentParcelsPage from '@/components/ResidentParcels.vue'
import StaffParcelsPage from '@/components/ManageParcels.vue'
import LoginPage from '@/components/LoginPage.vue'
import RegisterPage from '@/components/RegisterPage.vue'
import Announcement from '@/components/Announcement.vue'
import DashBoard from '@/components/DashBoard.vue'
import HomePageStaff from '@/components/HomePageStaff.vue'
import ManageResident from '@/components/ManageResident.vue'
import ManageAnnouncement from '@/components/ManageAnnouncement.vue'
import ProfileResident from '@/components/ProfileResident.vue'
import ProfileStaff from '@/components/ProfileStaff.vue'
const history = createWebHistory(import.meta.env.BASE_URL)
const routes = [
  // Default redirect
  {
    path: '/',
    redirect: '/loginpage'
  },

  // Auth
  {
    path: '/loginpage',
    name: 'login',
    component: LoginPage
  },
  {
    path: '/registerpage',
    name: 'register',
    component: RegisterPage
  },

  // Resident
  {
    path: '/homepage/resident',
    name: 'home',
    component: HomePageResident
  },
  {
    path: '/homepage/resident/parcelspage',
    name: 'residentparcels',
    component: ResidentParcelsPage
  },
  {
    path: '/homepage/resident/announcement',
    name: 'announcement',
    component: Announcement
  },
  ,
  {
    path: '/homepage/resident/profile',
    name: 'profileresident',
    component: ProfileResident
  },

  // Staff
  {
    path: '/homepage/staff',
    name: 'homestaff',
    component: HomePageStaff
  },
  {
    path: '/homepage/staff/manageresident',
    name: 'manageresident',
    component: ManageResident
  },
  {
    path: '/homepage/staff/manageparcel',
    name: 'staffparcels',
    component: StaffParcelsPage
  },
  {
    path: '/homepage/staff/manageannouncement',
    name: 'manageannouncement',
    component: ManageAnnouncement
  },
  {
    path: '/homepage/staff/parcelscannerpage',
    name: 'parcelscanner',
    component: ParcelScannerPage
  },
  {
    path: '/homepage/staff/dashboardpage',
    name: 'dashboard',
    component: DashBoard
  },
  {
    path: '/homepage/staff/profile',
    name: 'profilestaff',
    component: ProfileStaff
  }
]

const router = createRouter({
  history,
  routes
})

export default router
