<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoginRequest, request } from '@/requests/backend'
import { store } from '@/store'
import { reactive } from 'vue'

const state = reactive<LoginRequest>({
  email: '',
  password: '',
})

const onLogin = async () => {
  const auth = await request('/auth/login', state)
  store.auth = { ...auth, authenticated: true }
}

const onSignup = async () => {
  const auth = await request('/auth/signup', state)
  store.auth = { ...auth, authenticated: true }
}
</script>

<template>
  <Tabs default-value="log-in" class="w-full max-w-[400px]">
    <TabsList class="grid w-full grid-cols-2">
      <TabsTrigger value="log-in">Log in</TabsTrigger>
      <TabsTrigger value="sign-up">Sign up</TabsTrigger>
    </TabsList>
    <TabsContent value="log-in">
      <form @submit.prevent="onLogin">
        <Card>
          <CardHeader>
            <CardTitle>Log in</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <div class="space-y-1">
              <Label for="email">Email</Label>
              <Input required v-model="state.email" id="email" type="email" />
            </div>
            <div class="space-y-1">
              <Label for="password">Password</Label>
              <Input required v-model="state.password" id="password" type="password" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Send</Button>
          </CardFooter>
        </Card>
      </form>
    </TabsContent>
    <TabsContent value="sign-up">
      <form @submit.prevent="onSignup">
        <Card>
          <CardHeader>
            <CardTitle>Sign up</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <div class="space-y-1">
              <Label for="email">Email</Label>
              <Input required v-model="state.email" id="email" type="email" />
            </div>
            <div class="space-y-1">
              <Label for="password">Password</Label>
              <Input required v-model="state.password" id="password" type="password" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Send</Button>
          </CardFooter>
        </Card>
      </form>
    </TabsContent>
  </Tabs>
</template>
