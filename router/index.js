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
import EditParcels from '@/components/EditParcels.vue'
import ParcelsDetail from '@/components/ParcelsDetail.vue'
import DeleteParcels from '@/components/DeleteParcels.vue'
import ParcelResidentDetail from '@/components/ParcelResidentDetail.vue'
import ConfirmParcels from '@/components/ConfirmParcels.vue'
import ChangeParcelStatus from '@/components/ChangeParcelStatus.vue'
import ParcelTrash from '@/components/ParcelTrash.vue'
import ParcelScannerPageSender from '@/components/ParcelScannerPageSender.vue'
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
  ,
  {
    path: '/homepage/resident/:id',
    name: 'home',
    component: HomePageResident
  },
  {
    path: '/homepage/resident/:id/parcelspage',
    name: 'residentparcels',
    component: ResidentParcelsPage
  },
  ,
  {
    path: '/homepage/resident/:id/parcelspage/:tid/detailparcel',
    name: 'residentparcelsDetail',
    component: ParcelResidentDetail
  },
  {
    path: '/homepage/resident/:id/parcelspage/:tid/detailparcel/confirmparcel',
    name: 'residentparcelsConfirm',
    component: ConfirmParcels
  },
  {
    path: '/homepage/resident/:id/announcement',
    name: 'announcement',
    component: Announcement
  },
  ,
  {
    path: '/homepage/resident/:id/profile',
    name: 'profileresident',
    component: ProfileResident
  },

  // Staff
  {
    path: '/homepage/staff/:id',
    name: 'homestaff',
    component: HomePageStaff
  },
  {
    path: '/homepage/staff/:id/manageresident',
    name: 'manageresident',
    component: ManageResident
  },
  {
    path: '/homepage/staff/:id/manageparcel',
    name: 'staffparcels',
    component: StaffParcelsPage
  },
  {
    path: '/homepage/staff/:id/manageannouncement',
    name: 'manageannouncement',
    component: ManageAnnouncement
  },
  {
    path: '/homepage/staff/:id/parcelscannerpage',
    name: 'parcelscanner',
    component: ParcelScannerPage
  },
  ,
  {
    path: '/loginpage/shipping/parcelscannerpage',
    name: 'parcelscannershipping',
    component: ParcelScannerPageSender
  },
  {
    path: '/homepage/staff/:id/dashboardpage',
    name: 'dashboard',
    component: DashBoard
  },
  {
    path: '/homepage/staff/:id/profile',
    name: 'profilestaff',
    component: ProfileStaff
  },
  {
    path: '/homepage/staff/:id/manageparcel/:tid/changeparcel',
    name: 'editparcelstatus',
    component: ChangeParcelStatus
  },
  {
    path: '/homepage/staff/:id/manageparcel/:tid/detailparcel/editparcel',
    name: 'editparcels',
    component: EditParcels
  },
  {
    path: '/homepage/staff/:id/manageparcel/:tid/detailparcel',
    name: 'detailparcels',
    component: ParcelsDetail
  },
  {
    path: '/homepage/staff/:id/manageparcel/:tid/deleteparcel',
    name: 'deleteparcels',
    component: DeleteParcels
  },
  {
    path: '/homepage/staff/:id/manageparcel/:tid/detailparcel/trashparcel',
    name: 'trashparcels',
    component: ParcelTrash
  }
]

const router = createRouter({
  history,
  routes
})

export default router
