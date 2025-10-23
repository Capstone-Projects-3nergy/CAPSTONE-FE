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
const history = createWebHistory(import.meta.env.BASE_URL)
const routes = [
  {
    path: '/',
    redirect: '/loginpage'
  },
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
  {
    path: '/homepage/resident',
    name: 'home',
    component: HomePageResident
  },
  {
    path: '/homepage/staff',
    name: 'homestaff',
    component: HomePageStaff
  },
  {
    path: '/announcement',
    name: 'announcement',
    component: Announcement
  },
  {
    path: '/parcelscannerpage',
    name: 'parceldcanner',
    component: ParcelScannerPage
  },
  {
    path: '/residentparcelspage',
    name: 'residentparcels',
    component: ResidentParcelsPage
  },
  {
    path: '/staffparcelspage',
    name: 'staffparcels',
    component: StaffParcelsPage
  },
  {
    path: '/dashBoardpage',
    name: 'dashboard',
    component: DashBoard
  }
]

const router = createRouter({
  history,
  routes
})

export default router
